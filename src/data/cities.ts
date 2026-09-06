export type CityStatus = "live" | "soon";

export type City = {
  id: string;
  name: string;
  nameEn: string;
  status: CityStatus;
  lng: number;
  lat: number;
  href?: string;
};

export const CITIES: City[] = [
  {
    id: "amba",
    name: "Buenos Aires · AMBA",
    nameEn: "Buenos Aires metro",
    status: "live",
    lng: -58.42,
    lat: -34.6,
    href: "/amba",
  },
  {
    id: "cordoba",
    name: "Córdoba",
    nameEn: "Córdoba",
    status: "soon",
    lng: -64.1888,
    lat: -31.4201,
  },
  {
    id: "rosario",
    name: "Rosario",
    nameEn: "Rosario",
    status: "soon",
    lng: -60.6393,
    lat: -32.9442,
  },
  {
    id: "mendoza",
    name: "Mendoza",
    nameEn: "Mendoza",
    status: "soon",
    lng: -68.8458,
    lat: -32.8895,
  },
  {
    id: "bariloche",
    name: "Bariloche",
    nameEn: "Bariloche",
    status: "soon",
    lng: -71.31,
    lat: -41.1335,
  },
  {
    id: "salta",
    name: "Salta",
    nameEn: "Salta",
    status: "soon",
    lng: -65.4117,
    lat: -24.7821,
  },
  {
    id: "mdp",
    name: "Mar del Plata",
    nameEn: "Mar del Plata",
    status: "soon",
    lng: -57.5426,
    lat: -38.0055,
  },
];
