import React from 'react';
import styled from 'styled-components';
import useGetProfileQuery from '../query/profile/useGetProfileQuery';
import { Header } from '../components/header';
import { SideBar } from '../components/sideBar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  const { data: profile } = useGetProfileQuery();
  if (profile.name === undefined) {
    window.location.href = '/';
  }

  return (
    <>
      <Header />
      <Container>
        <SideBar />
        <Outlet />
      </Container>
    </>
  );
};

const Container = styled.main`
  display: flex;
`;

export default MainLayout;
