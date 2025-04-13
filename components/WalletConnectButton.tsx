"use client"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function WalletConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    connect({ connector: injected() })
  }

  return isConnected ? (
    <button 
      onClick={() => disconnect()} 
      style={{
        backgroundColor: '#4BD16F',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'background-color 0.2s ease',
        boxShadow: '0 2px 4px rgba(75, 209, 111, 0.3)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#41b860';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#4BD16F';
      }}
    >
      Disconnect ({address?.slice(0, 6)}...{address?.slice(-4)})
    </button>
  ) : (
    <button 
      onClick={handleConnect} 
      style={{
        backgroundColor: '#4BD16F',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'background-color 0.2s ease',
        boxShadow: '0 2px 4px rgba(75, 209, 111, 0.3)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#41b860';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#4BD16F';
      }}
    >
      <span style={{ marginRight: '8px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 7H18V6C18 4.93913 17.5786 3.92172 16.8284 3.17157C16.0783 2.42143 15.0609 2 14 2H10C8.93913 2 7.92172 2.42143 7.17157 3.17157C6.42143 3.92172 6 4.93913 6 6V7H5C4.20435 7 3.44129 7.31607 2.87868 7.87868C2.31607 8.44129 2 9.20435 2 10V18C2 18.7956 2.31607 19.5587 2.87868 20.1213C3.44129 20.6839 4.20435 21 5 21H19C19.7956 21 20.5587 20.6839 21.1213 20.1213C21.6839 19.5587 22 18.7956 22 18V10C22 9.20435 21.6839 8.44129 21.1213 7.87868C20.5587 7.31607 19.7956 7 19 7ZM8 6C8 5.46957 8.21071 4.96086 8.58579 4.58579C8.96086 4.21071 9.46957 4 10 4H14C14.5304 4 15.0391 4.21071 15.4142 4.58579C15.7893 4.96086 16 5.46957 16 6V7H8V6Z" fill="white"/>
        </svg>
      </span>
      Connect Wallet
    </button>
  )
} 