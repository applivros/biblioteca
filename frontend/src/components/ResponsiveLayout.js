import styled from 'styled-components';

export const DesktopOnly = styled.div`
  @media (max-width: 900px) {
    display: none;
  }
`;

export const MobileOnly = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: block;
  }
`;
