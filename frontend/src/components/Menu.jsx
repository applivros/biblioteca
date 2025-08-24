import React from 'react';
import styled from 'styled-components';

const MenuBar = styled.nav`
  width: 100vw;
  max-width: 100vw;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.primary};
  box-shadow: 0 2px 12px ${({ theme }) => theme.colors.primary}22;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1rem;
  position: sticky;
  top: 0;
  z-index: 30;
  animation: fadeInMenu 0.7s ease;
  @keyframes fadeInMenu {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  overflow-x: hidden;
  @media (max-width: 900px) {
    display: none;
  }
`;

const BottomBar = styled.nav`
  display: none;
  @media (max-width: 900px) {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    background: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 -2px 12px ${({ theme }) => theme.colors.primary}22;
    width: 100vw;
    justify-content: space-around;
    align-items: center;
    padding: 0.5rem 0;
    border-radius: 12px 12px 0 0;
  }
`;

const Logo = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 0.7rem;
`;

const MenuLinks = styled.div`
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  min-width: 0;
  justify-content: center;
  width: 100%;
  @media (max-width: 900px) {
    gap: 0.7rem;
  }
  @media (max-width: 700px) {
    gap: 0.3rem;
  }
`;

const MenuButton = styled.button`
  position: relative;
  background: ${({ active, theme }) => active ? theme.colors.accent : 'transparent'};
  border: ${({ active, theme }) => active ? `2px solid ${theme.colors.primary}` : '2px solid transparent'};
  color: ${({ active, theme }) => active ? theme.colors.primary : '#fff'};
  font-size: 1.08rem;
  font-family: inherit;
  cursor: pointer;
  padding: 0.55rem 1.1rem;
  border-radius: 10px;
  margin-right: 0.5rem;
  font-weight: 500;
  box-shadow: ${({ active, theme }) => active ? `0 2px 8px ${theme.colors.accent}22` : 'none'};
  transition: background 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s;
  outline: none;
  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 2px 8px ${({ theme }) => theme.colors.secondary}22;
  }
  &:active {
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }
`;

function Menu({ navItems, extra }) {
  return (
    <>
      <MenuBar>
        <Logo>📚 Biblioteca</Logo>
        <MenuLinks>
          {navItems?.map((item, idx) => (
            <React.Fragment key={item.key}>
              <MenuButton
                onClick={item.onClick}
                active={item.active}
                style={item.key === 'logout' ? {marginLeft:'2rem'} : {}}
              >
                <span style={{display:'inline-block',marginRight:'0.5rem'}}>{item.icon}</span>
                <span>{item.label}</span>
              </MenuButton>
              {/* Separação visual para logout */}
              {item.key === 'logout' && idx !== navItems.length-1 && (
                <span style={{width:'2px',height:'28px',background:'#FFD54F',borderRadius:'2px',margin:'0 0.7rem',opacity:0.5}}></span>
              )}
            </React.Fragment>
          ))}
          {extra}
        </MenuLinks>
      </MenuBar>
      <BottomBar>
        {navItems?.map(item => (
          <MenuButton
            key={item.key}
            onClick={item.onClick}
            active={item.active}
            style={{margin:'0',padding:'0.5rem 0.7rem',fontSize:'1.2rem',borderRadius:'50%',background:item.active?item.theme?.colors?.accent||'#FFD54F':'transparent',color:item.active?'#4A90E2':'#fff'}}
          >
            <span>{item.icon}</span>
          </MenuButton>
        ))}
      </BottomBar>
    </>
  );
}

export default Menu;
