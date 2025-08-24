

import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: ${({ theme }) => theme.mode === 'dark'
      ? '#181A20'
      : '#F7F8FA'};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.main};
    transition: background 0.4s, color 0.3s;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }
  h1, h2, h3 {
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 0.7rem;
    letter-spacing: 1px;
    font-weight: 700;
    text-shadow: none;
  }
  .container {
    max-width: 900px;
    width: 100vw;
    margin: 2rem auto;
    padding: 2rem 1rem;
    background: ${({ theme }) => theme.mode === 'dark' ? '#23272F' : '#fff'};
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(24,26,32,0.07);
    display: flex;
    flex-direction: column;
    gap: 2rem;
    animation: fadeIn 0.7s ease;
    box-sizing: border-box;
    overflow-x: auto;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 900px) {
    .container {
      max-width: 100vw;
      padding: 1rem;
      border-radius: 0;
      box-shadow: none;
      gap: 1rem;
    }
    h1 {
      font-size: 1.5rem;
    }
  }
  @media (max-width: 700px) {
    .container {
      padding: 0.5rem;
      gap: 0.5rem;
      min-width: 0;
      border-radius: 0;
    }
    h1, h2, h3 {
      font-size: 1rem;
    }
    body {
      font-size: 0.98rem;
    }
  }

  /* Card base para todos os cards */
  .card-base {
    background: ${({ theme }) => theme.mode === 'dark' ? '#23272F' : '#F7F8FA'};
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(24,26,32,0.07);
    padding: 1.2rem;
    transition: box-shadow 0.2s, background 0.3s;
    margin-bottom: 1rem;
    border: 1px solid ${({ theme }) => theme.colors.secondary}22;
  }

  /* Botão base */
  .btn-base {
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 1rem;
    box-shadow: 0 1px 4px rgba(24,26,32,0.07);
    transition: background 0.2s, transform 0.2s;
    &:hover {
      background: ${({ theme }) => theme.colors.secondary};
      color: ${({ theme }) => theme.colors.primary};
      transform: scale(1.04);
    }
  }
`;

export default GlobalStyle;
