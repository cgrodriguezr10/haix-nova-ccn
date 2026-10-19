export interface Comparendo {
  codigo: string
  descripcion: string
  fecha: string
  valor: number
  municipioAcreedor: string
}

export interface VehiculoCartera {
  id: string
  placa: string
  propietario: string
  cedula: string
  ciudad: string
  zona: string
  fechaAvistamiento: string
  horaAvistamiento: string
  comparendos: Comparendo[]
  diasMora: number
  avistamientos30d: number
  estadoGestion: 'Sin gestión' | 'Notificado' | 'En proceso jurídico'
}

export const CARTERA_DATA: VehiculoCartera[] = [
  {
    id: '1',
    placa: 'ABC-123',
    propietario: 'Carlos Hernández Mora',
    cedula: '79.542.318',
    ciudad: 'Bogotá',
    zona: 'Av. Eldorado con Carrera 68',
    fechaAvistamiento: '2026-10-18',
    horaAvistamiento: '08:14',
    comparendos: [
      { codigo: 'C02', descripcion: 'Exceso de velocidad en zona urbana', fecha: '2025-03-12', valor: 877016, municipioAcreedor: 'Bogotá' },
      { codigo: 'C29', descripcion: 'No usar cinturón de seguridad', fecha: '2025-07-05', valor: 292338, municipioAcreedor: 'Bogotá' },
      { codigo: 'D02', descripcion: 'Conducir con documentos vencidos', fecha: '2026-01-20', valor: 438508, municipioAcreedor: 'Medellín' },
    ],
    diasMora: 584,
    avistamientos30d: 7,
    estadoGestion: 'Notificado',
  },
  {
    id: '2',
    placa: 'MNP-847',
    propietario: 'Luisa Fernanda Gómez Ríos',
    cedula: '52.881.204',
    ciudad: 'Bogotá',
    zona: 'Calle 26 con Carrera 30',
    fechaAvistamiento: '2026-10-17',
    horaAvistamiento: '17:38',
    comparendos: [
      { codigo: 'C19', descripcion: 'Adelantar en zona prohibida', fecha: '2024-11-08', valor: 1462694, municipioAcreedor: 'Cali' },
      { codigo: 'C37', descripcion: 'Estacionar en zona prohibida', fecha: '2025-09-14', valor: 292338, municipioAcreedor: 'Bogotá' },
    ],
    diasMora: 710,
    avistamientos30d: 12,
    estadoGestion: 'En proceso jurídico',
  },
  {
    id: '3',
    placa: 'XYZ-561',
    propietario: 'Jorge Alberto Ramírez Castro',
    cedula: '1.020.438.772',
    ciudad: 'Medellín',
    zona: 'Autopista Sur con Av. Las Vegas',
    fechaAvistamiento: '2026-10-18',
    horaAvistamiento: '11:02',
    comparendos: [
      { codigo: 'C02', descripcion: 'Exceso de velocidad en zona urbana', fecha: '2026-02-28', valor: 877016, municipioAcreedor: 'Medellín' },
    ],
    diasMora: 232,
    avistamientos30d: 4,
    estadoGestion: 'Sin gestión',
  },
  {
    id: '4',
    placa: 'TRQ-290',
    propietario: 'Andrés Felipe Vargas Pinto',
    cedula: '80.127.563',
    ciudad: 'Cali',
    zona: 'Av. Roosevelt con Calle 5',
    fechaAvistamiento: '2026-10-16',
    horaAvistamiento: '09:55',
    comparendos: [
      { codigo: 'C14', descripcion: 'Conducir hablando por celular', fecha: '2025-05-17', valor: 438508, municipioAcreedor: 'Cali' },
      { codigo: 'C02', descripcion: 'Exceso de velocidad en zona escolar', fecha: '2025-12-03', valor: 1462694, municipioAcreedor: 'Barranquilla' },
      { codigo: 'C29', descripcion: 'No usar cinturón de seguridad', fecha: '2026-04-11', valor: 292338, municipioAcreedor: 'Cali' },
    ],
    diasMora: 521,
    avistamientos30d: 9,
    estadoGestion: 'Notificado',
  },
  {
    id: '5',
    placa: 'GHJ-034',
    propietario: 'María Alejandra Torres Niño',
    cedula: '53.049.817',
    ciudad: 'Barranquilla',
    zona: 'Av. Murillo con Carrera 44',
    fechaAvistamiento: '2026-10-19',
    horaAvistamiento: '07:22',
    comparendos: [
      { codigo: 'D05', descripcion: 'No respetar señal de PARE', fecha: '2025-08-19', valor: 877016, municipioAcreedor: 'Barranquilla' },
      { codigo: 'C37', descripcion: 'Estacionar obstruyendo vía pública', fecha: '2026-03-07', valor: 292338, municipioAcreedor: 'Barranquilla' },
    ],
    diasMora: 426,
    avistamientos30d: 6,
    estadoGestion: 'Sin gestión',
  },
  {
    id: '6',
    placa: 'PLK-718',
    propietario: 'Roberto Carlos Mendoza Flórez',
    cedula: '72.304.951',
    ciudad: 'Bogotá',
    zona: 'Carrera 7 con Calle 72',
    fechaAvistamiento: '2026-10-18',
    horaAvistamiento: '14:47',
    comparendos: [
      { codigo: 'C19', descripcion: 'Girar en U en sitio prohibido', fecha: '2024-09-30', valor: 438508, municipioAcreedor: 'Bogotá' },
    ],
    diasMora: 749,
    avistamientos30d: 3,
    estadoGestion: 'En proceso jurídico',
  },
  {
    id: '7',
    placa: 'WER-452',
    propietario: 'Diana Carolina Suárez López',
    cedula: '1.075.238.614',
    ciudad: 'Medellín',
    zona: 'Calle 33 con Carrera 65 El Poblado',
    fechaAvistamiento: '2026-10-17',
    horaAvistamiento: '19:11',
    comparendos: [
      { codigo: 'C02', descripcion: 'Exceso de velocidad en vía urbana', fecha: '2025-04-22', valor: 877016, municipioAcreedor: 'Medellín' },
      { codigo: 'C14', descripcion: 'Uso de celular conduciendo', fecha: '2025-10-09', valor: 438508, municipioAcreedor: 'Cali' },
    ],
    diasMora: 545,
    avistamientos30d: 8,
    estadoGestion: 'Notificado',
  },
  {
    id: '8',
    placa: 'BNM-603',
    propietario: 'Fabio Ernesto Castillo Peña',
    cedula: '79.814.337',
    ciudad: 'Cali',
    zona: 'Av. 6N con Calle 34N',
    fechaAvistamiento: '2026-10-15',
    horaAvistamiento: '10:30',
    comparendos: [
      { codigo: 'D02', descripcion: 'Ignorar semáforo en rojo', fecha: '2025-06-14', valor: 1462694, municipioAcreedor: 'Cali' },
      { codigo: 'C29', descripcion: 'Pasajero sin cinturón', fecha: '2025-11-28', valor: 292338, municipioAcreedor: 'Cali' },
      { codigo: 'C37', descripcion: 'Parqueo en zona amarilla', fecha: '2026-05-03', valor: 292338, municipioAcreedor: 'Barranquilla' },
    ],
    diasMora: 492,
    avistamientos30d: 5,
    estadoGestion: 'Sin gestión',
  },
  {
    id: '9',
    placa: 'QWE-971',
    propietario: 'Patricia Inés Morales Vega',
    cedula: '41.728.596',
    ciudad: 'Barranquilla',
    zona: 'Carrera 54 con Calle 74 El Prado',
    fechaAvistamiento: '2026-10-19',
    horaAvistamiento: '08:58',
    comparendos: [
      { codigo: 'C02', descripcion: 'Exceso de velocidad autopista', fecha: '2024-12-01', valor: 877016, municipioAcreedor: 'Bogotá' },
    ],
    diasMora: 687,
    avistamientos30d: 2,
    estadoGestion: 'Notificado',
  },
  {
    id: '10',
    placa: 'ZXC-385',
    propietario: 'Hernando José Díaz Arboleda',
    cedula: '8.542.019',
    ciudad: 'Bogotá',
    zona: 'Autopista Norte con Calle 170',
    fechaAvistamiento: '2026-10-18',
    horaAvistamiento: '06:45',
    comparendos: [
      { codigo: 'C02', descripcion: 'Exceso de velocidad zona residencial', fecha: '2025-02-14', valor: 877016, municipioAcreedor: 'Bogotá' },
      { codigo: 'D05', descripcion: 'No detenerse en señal PARE', fecha: '2025-08-31', valor: 877016, municipioAcreedor: 'Medellín' },
    ],
    diasMora: 611,
    avistamientos30d: 11,
    estadoGestion: 'En proceso jurídico',
  },
  {
    id: '11',
    placa: 'RTY-246',
    propietario: 'Camilo Andrés Ospina Jaramillo',
    cedula: '1.037.582.943',
    ciudad: 'Medellín',
    zona: 'Av. El Poblado con Calle 10',
    fechaAvistamiento: '2026-10-17',
    horaAvistamiento: '15:23',
    comparendos: [
      { codigo: 'C14', descripcion: 'Conducir con auriculares', fecha: '2026-01-07', valor: 438508, municipioAcreedor: 'Medellín' },
      { codigo: 'C37', descripcion: 'Obstruir carril bici', fecha: '2026-06-19', valor: 292338, municipioAcreedor: 'Medellín' },
      { codigo: 'C29', descripcion: 'Menor sin sistema de retención', fecha: '2026-08-04', valor: 584676, municipioAcreedor: 'Bogotá' },
    ],
    diasMora: 284,
    avistamientos30d: 14,
    estadoGestion: 'Sin gestión',
  },
  {
    id: '12',
    placa: 'FGH-519',
    propietario: 'Gloria Esperanza Rincón Torres',
    cedula: '52.214.873',
    ciudad: 'Barranquilla',
    zona: 'Av. Las Américas con Carrera 38',
    fechaAvistamiento: '2026-10-16',
    horaAvistamiento: '12:05',
    comparendos: [
      { codigo: 'D02', descripcion: 'Conducir en estado de embriaguez', fecha: '2024-10-15', valor: 2925388, municipioAcreedor: 'Barranquilla' },
    ],
    diasMora: 733,
    avistamientos30d: 1,
    estadoGestion: 'En proceso jurídico',
  },
  {
    id: '13',
    placa: 'VBN-137',
    propietario: 'Jaime Augusto Bermúdez Salcedo',
    cedula: '19.478.632',
    ciudad: 'Cali',
    zona: 'Calle 5 con Carrera 100 Autopista',
    fechaAvistamiento: '2026-10-18',
    horaAvistamiento: '16:40',
    comparendos: [
      { codigo: 'C02', descripcion: 'Exceso de velocidad autopista', fecha: '2025-07-22', valor: 877016, municipioAcreedor: 'Cali' },
      { codigo: 'C19', descripcion: 'Cambio de carril sin señalizar', fecha: '2025-12-11', valor: 438508, municipioAcreedor: 'Cali' },
    ],
    diasMora: 453,
    avistamientos30d: 6,
    estadoGestion: 'Notificado',
  },
  {
    id: '14',
    placa: 'UIO-864',
    propietario: 'Sandra Milena Guerrero Ávila',
    cedula: '40.913.275',
    ciudad: 'Bogotá',
    zona: 'Calle 80 con Av. Boyacá',
    fechaAvistamiento: '2026-10-19',
    horaAvistamiento: '07:50',
    comparendos: [
      { codigo: 'C37', descripcion: 'Parqueo en anden peatonal', fecha: '2025-10-03', valor: 292338, municipioAcreedor: 'Bogotá' },
    ],
    diasMora: 381,
    avistamientos30d: 3,
    estadoGestion: 'Sin gestión',
  },
  {
    id: '15',
    placa: 'HJK-423',
    propietario: 'Nicolás Esteban Pineda Caro',
    cedula: '1.000.874.521',
    ciudad: 'Barranquilla',
    zona: 'Av. Circunvalar con Calle 82',
    fechaAvistamiento: '2026-10-17',
    horaAvistamiento: '20:18',
    comparendos: [
      { codigo: 'C02', descripcion: 'Exceso de velocidad zona escolar', fecha: '2025-09-05', valor: 1462694, municipioAcreedor: 'Barranquilla' },
      { codigo: 'D05', descripcion: 'Irrespetar luz roja semáforo', fecha: '2026-02-17', valor: 877016, municipioAcreedor: 'Bogotá' },
    ],
    diasMora: 408,
    avistamientos30d: 7,
    estadoGestion: 'Notificado',
  },
]