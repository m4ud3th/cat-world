export type CatLocationCategory = 'real' | 'fictional' | 'breed';

export type CatLocation = {
  name: string;
  latitude: number;
  longitude: number;
  iconUrl: string;
  category: CatLocationCategory;
};

export const CAT_LOCATIONS: CatLocation[] = [
  {
    name: 'Grumpy Cat',
    latitude: 32.95,
    longitude: -110.97,
    iconUrl: '/imgs/meowrker.png',
    category: 'real'
  },
  {
    name: 'Uni',
    latitude: 36.2,
    longitude: 138.25,
    iconUrl: '/imgs/meowrker.png',
    category: 'real'
  },
  {
    name: 'Garfield',
    latitude: 39.9,
    longitude: -86.28,
    iconUrl: '/imgs/meowrker.png',
    category: 'fictional'
  },
  {
    name: 'Hello Kitty',
    latitude: 35.6764,
    longitude: 139.65,
    iconUrl: '/imgs/meowrker.png',
    category: 'fictional'
  },
  {
    name: 'Tom',
    latitude: 34.0522,
    longitude: -118.2437,
    iconUrl: '/imgs/meowrker.png',
    category: 'fictional'
  },
  {
    name: 'Puss in Boots',
    latitude: 41.9028,
    longitude: 12.4964,
    iconUrl: '/imgs/meowrker.png',
    category: 'fictional'
  },
  {
    name: 'Siamese',
    latitude: 13.7563,
    longitude: 100.5018,
    iconUrl: '/imgs/meowrker.png',
    category: 'breed'
  },
  {
    name: 'Persian',
    latitude: 35.6892,
    longitude: 51.389,
    iconUrl: '/imgs/meowrker.png',
    category: 'breed'
  },
  {
    name: 'Maine Coon',
    latitude: 43.6591,
    longitude: -70.2568,
    iconUrl: '/imgs/meowrker.png',
    category: 'breed'
  },
  {
    name: 'Norwegian Forest',
    latitude: 59.9139,
    longitude: 10.7522,
    iconUrl: '/imgs/meowrker.png',
    category: 'breed'
  }
];