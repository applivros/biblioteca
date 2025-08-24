import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(120deg, #f6f6f6 0%, #e0ece4 100%);
  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.aside`
  width: 220px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  box-shadow: 2px 0 12px rgba(79, 138, 139, 0.07);
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.2rem;
  gap: 2rem;
  @media (max-width: 900px) {
    width: 70px;
    padding: 1rem 0.3rem;
    font-size: 1rem;
    gap: 1rem;
  }
  @media (max-width: 700px) {
    flex-direction: row;
    width: 100vw;
    height: 60px;
    padding: 0.5rem 0.2rem;
    justify-content: space-around;
    box-shadow: 0 2px 12px rgba(79, 138, 139, 0.07);
    position: sticky;
    top: 0;
    z-index: 20;
  }
`;

const Logo = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  letter-spacing: 2px;
  @media (max-width: 900px) {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  @media (max-width: 700px) {
    margin-bottom: 0;
    margin-right: 1rem;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  @media (max-width: 700px) {
    flex-direction: row;
    gap: 0.5rem;
    width: auto;
    align-items: center;
  }
`;

const NavItem = styled.button`
  background: ${({ active, theme }) => active ? theme.colors.secondary : 'none'};
  border: none;
  color: ${({ active, theme }) => active ? theme.colors.text : '#fff'};
  font-size: 1.1rem;
  font-family: inherit;
  cursor: pointer;
  padding: 0.7rem 0.7rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  margin-bottom: 0.5rem;
  box-shadow: ${({ active }) => active ? '0 2px 8px rgba(251,212,109,0.13)' : 'none'};
  font-weight: ${({ active }) => active ? 'bold' : 'normal'};
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.text};
  }
  @media (max-width: 700px) {
    width: auto;
    font-size: 1.1rem;
    padding: 0.5rem 0.7rem;
    margin-bottom: 0;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  @media (max-width: 700px) {
    margin-top: 0.5rem;
  }
`;

const Header = styled.header`
  background: #fff;
  padding: 1.2rem 2rem;
  box-shadow: 0 2px 12px rgba(79, 138, 139, 0.07);
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.7rem;
  color: ${({ theme }) => theme.colors.primary};
  position: sticky;
  top: 0;
  z-index: 10;
  @media (max-width: 900px) {
    padding: 1rem 1rem;
    font-size: 1.2rem;
  }
  @media (max-width: 700px) {
    padding: 0.7rem 1rem;
    font-size: 1.1rem;
  }
`;

function Layout({ children, navItems }) {
  return (
    <Wrapper>
      <Sidebar>
        <Logo>📚</Logo>
        <Nav>
          {navItems?.map(item => (
            <NavItem
              key={item.key}
              active={item.active}
              onClick={item.onClick}
              aria-current={item.active ? 'page' : undefined}
            >
              <span style={{fontSize: '1.3em'}}>{item.icon}</span>
              <span style={{display: 'inline-block'}}>{item.label}</span>
            </NavItem>
          ))}
        </Nav>
      </Sidebar>
      <Content>
        <Header>Minha Biblioteca Virtual</Header>
        <div className="container">
          {children}
        </div>
      </Content>
    </Wrapper>
  );
}

export default Layout;
