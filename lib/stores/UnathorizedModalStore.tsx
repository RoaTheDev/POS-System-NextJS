'use client'

import React, {createContext, useContext, useState} from 'react'
import UnauthorizedModal from '@/components/common/UnauthorizedModal'

type ModalContextType = {
    showUnauthorizedModal: () => void;
    hideUnauthorizedModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
    showUnauthorizedModal: () => {
    },
    hideUnauthorizedModal: () => {
    }
})

export const useModal = () => useContext(ModalContext)

export const UnauthorizedModalProvider = ({children}: { children: React.ReactNode }) => {
    const [isUnauthorizedModalOpen, setIsUnauthorizedModalOpen] = useState(false)

    const showUnauthorizedModal = () => setIsUnauthorizedModalOpen(true)
    const hideUnauthorizedModal = () => setIsUnauthorizedModalOpen(false)

    return (
        <ModalContext.Provider value={{
            showUnauthorizedModal,
            hideUnauthorizedModal
        }}>
            {children}

            <UnauthorizedModal
                isOpen={isUnauthorizedModalOpen}
                onCloseAction={hideUnauthorizedModal}
            />
        </ModalContext.Provider>
    )
}