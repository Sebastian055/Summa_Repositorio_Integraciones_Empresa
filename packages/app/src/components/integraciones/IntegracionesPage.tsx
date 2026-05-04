import React, { useState } from 'react';
import { Tabs, Tab, Box, Container } from '@mui/material';
import { RegistroIntegracion } from './RegistroIntegracion';
import { ListaIntegraciones } from './ListaIntegraciones';
import { TableroResumen } from './TableroResumen';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const IntegracionesPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  const handleRegistroExitoso = () => {
    setRefreshKey(prev => prev + 1);
    setTabValue(1);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
          <Tab label="Registrar integración" />
          <Tab label="Inventario" />
          <Tab label="Resumen" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <RegistroIntegracion onRegistroExitoso={handleRegistroExitoso} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ListaIntegraciones key={refreshKey} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableroResumen />
      </TabPanel>
    </Container>
  );
};
