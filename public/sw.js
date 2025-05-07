if (!self.define) {
    let registry = {};

    let nextDefineUri;

    const singleRequire = (uri, parentUri) => {
        uri = new URL(uri + ".js", parentUri).href;
        return (
            registry[uri] ||
            new Promise((resolve) => {
                if ("document" in self) {
                    const script = document.createElement("script");
                    script.src = uri;
                    script.onload = resolve;
                    document.head.appendChild(script);
                } else {
                    nextDefineUri = uri;
                    importScripts(uri);
                    resolve();
                }
            }).then(() => {
                let promise = registry[uri];
                if (!promise) {
                    throw new Error(`Module ${uri} didn’t register its module`);
                }
                return promise;
            })
        );
    };

    self.define = (depsNames, factory) => {
        const uri =
            nextDefineUri ||
            ("document" in self ? document.currentScript.src : "") ||
            location.href;
        if (registry[uri]) {
            return;
        }
        let exports = {};
        const require = (depUri) => singleRequire(depUri, uri);
        const specialDeps = {
            module: {uri},
            exports,
            require,
        };
        registry[uri] = Promise.all(
            depsNames.map((depName) => specialDeps[depName] || require(depName))
        ).then((deps) => {
            factory(...deps);
            return exports;
        });
    };
}

define(["./workbox-7144475a"], function (workbox) {
    "use strict";

    self.skipWaiting();
    workbox.clientsClaim();

    workbox.precacheAndRoute([
        {url: "/", revision: "1"},
        {url: "/index.html", revision: "1"},
        {url: "/manifest.json", revision: "1"},
        {url: "/icon-192x192.png", revision: "1"},
        {url: "/icon-512x512.png", revision: "1"},
    ]);

    workbox.registerRoute(
        "/",
        new workbox.NetworkFirst({
            cacheName: "start-url",
            plugins: [
                {
                    cacheWillUpdate: async ({response}) => {
                        return response && response.status === 200 ? response : null;
                    },
                },
            ],
        }),
        "GET"
    );

    workbox.registerRoute(
        /\.(?:js|css|png|jpg|jpeg|svg|gif)$/,
        new workbox.CacheFirst({
            cacheName: "static-assets",
            plugins: [
                {
                    cacheWillUpdate: async ({response}) => {
                        return response && response.status === 200 ? response : null;
                    },
                },
            ],
        }),
        "GET"
    );

    workbox.registerRoute(
        /.*/i,
        new workbox.NetworkOnly({
            cacheName: "dev",
            plugins: [],
        }),
        "GET"
    );


});