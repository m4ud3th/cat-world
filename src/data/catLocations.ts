export type CatLocationCategory = 'real' | 'fictional' | 'breed';
export type CatMenuCategory = CatLocationCategory | 'all';

export type TimelineEntry = {
  date: string;
  event: string;
};

export type AssociatedReference = {
  label: string;
  kind: 'owner' | 'social' | 'organization';
  handle?: string;
  url?: string;
};

export type RealCatInfo = {
  breed: string;
  origin: string;
  story: string;
  backstoryBiography: string;
  timeline: TimelineEntry[];
  associatedHumansAccounts: AssociatedReference[];
};

export type FictionalCatInfo = {
  originSource: string;
  story: string;
  universeFranchiseCreator: string;
  roleInStory: string;
  personalityTraits: string[];
  abilitiesOrSpecialTraits: string[];
  firstAppearance: {
    year: string;
    work: string;
  };
};

export type PhysicalCharacteristics = {
  size: string;
  coatType: string;
  colorPatterns: string[];
};

export type CareRequirements = {
  groomingNeeds: string;
  exerciseLevel: string;
  healthConsiderations: string[];
};

export type BreedCatInfo = {
  origin: string;
  history: string;
  physicalCharacteristics: PhysicalCharacteristics;
  temperament: string[];
  careRequirements: CareRequirements;
  lifespan: string;
  similarBreeds?: string[];
};

type CatLocationBase = {
  name: string;
  cityOfOrigin: string;
  latitude: number;
  longitude: number;
  iconUrl: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type CatLocation =
  | (CatLocationBase & { category: 'real'; info: RealCatInfo })
  | (CatLocationBase & { category: 'fictional'; info: FictionalCatInfo })
  | (CatLocationBase & { category: 'breed'; info: BreedCatInfo });

export const CAT_LOCATIONS: CatLocation[] = [
  {
    name: 'Grumpy Cat',
    cityOfOrigin: 'Morristown',
    latitude: 32.95,
    longitude: -110.97,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/grumpycat.jpg',
    imageAlt: 'Grumpy Cat',
    category: 'real',
    info: {
      breed: 'Mixed breed (domestic shorthair)',
      origin: 'Arizona, United States',
      story:
        "Born in Arizona in April 2012, Tardar Sauce shot to fame when her owner's brother posted a photo to Reddit. Her permanently displeased expression — caused by feline dwarfism and an underbite — sparked a global meme phenomenon, a licensing empire, and even a feature film. She passed away in May 2019, leaving behind one of the internet's most recognisable faces.",
      backstoryBiography:
        'Grumpy Cat (Tardar Sauce) became an internet sensation because of her distinctive facial expression linked to feline dwarfism and an underbite.',
      timeline: [
        { date: 'April 2012', event: 'Birth (known).' },
        { date: 'September 2012', event: 'Photo posted to Reddit goes viral.' },
        { date: '2013-2018', event: 'Major media appearances, books, and licensing milestones.' },
        { date: 'May 2019', event: 'Passed away after complications from a UTI.' }
      ],
      associatedHumansAccounts: [
        { label: 'Tabatha Bundesen', kind: 'owner' },
        {
          label: 'Instagram',
          kind: 'social',
          handle: '@realgrumpycat',
          url: 'https://www.instagram.com/realgrumpycat/'
        },
        {
          label: 'X',
          kind: 'social',
          handle: '@RealGrumpyCat',
          url: 'https://x.com/RealGrumpyCat'
        },
        { label: 'Grumpy Cat Limited', kind: 'organization' }
      ]
    }
  },
  {
    name: 'Uni',
    cityOfOrigin: 'Nagano',
    latitude: 36.2,
    longitude: 138.25,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/uni.jpg',
    imageAlt: 'Uni cat',
    category: 'real',
    info: {
      breed: 'Longhair domestic cat',
      origin: 'Japan',
      story:
        "Uni is a serene, fluffy cat from Japan whose photogenic calm made her a quiet favourite in online cat communities. Her owner-managed account drew steady engagement through candid photos and short clips, and fan reposts spread her image well beyond Japan's borders. She remains a recurring fixture in cat-appreciation corners of the internet.",
      backstoryBiography:
        'Uni is a real cat from Japan known for a calm expression and fluffy look that became popular in online cat communities and photo accounts.',
      timeline: [
        { date: 'Early life', event: 'Raised in Japan as a companion cat.' },
        { date: 'Online growth', event: 'Photos and short clips gained consistent engagement on social platforms.' },
        { date: 'Current', event: 'Continues to appear in cat-focused posts and fan compilations.' }
      ],
      associatedHumansAccounts: [
        { label: 'Owner-managed account', kind: 'owner' },
        {
          label: 'Instagram',
          kind: 'social',
          handle: '@unico_uniuni',
          url: 'https://www.instagram.com/unico_uniuni/'
        }
      ]
    }
  },
  {
    name: 'Garfield',
    cityOfOrigin: 'Muncie',
    latitude: 39.9,
    longitude: -86.28,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/garfield.jpg',
    imageAlt: 'Garfield',
    category: 'fictional',
    info: {
      originSource: 'Comic strip',
      story:
        'Created by Jim Davis and first syndicated in 1978, Garfield is a cynical, lasagna-obsessed orange tabby who shares a house with his hapless owner Jon Arbuckle and the eager dog Odie. His deadpan hatred of Mondays and bottomless appetite for food made him one of the most widely read comic-strip characters in history, appearing in newspapers across more than 80 countries.',
      universeFranchiseCreator: 'Garfield universe by Jim Davis',
      roleInStory: 'Main character',
      personalityTraits: ['Sarcastic', 'Lazy', 'Food-motivated'],
      abilitiesOrSpecialTraits: ['Human-like reactions', 'Comedic fourth-wall style humor'],
      firstAppearance: {
        year: '1978',
        work: 'Garfield comic strip'
      }
    }
  },
  {
    name: 'Hello Kitty',
    cityOfOrigin: 'Tokyo',
    latitude: 35.6764,
    longitude: 139.65,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/hellokitty.jpg',
    imageAlt: 'Hello Kitty',
    category: 'fictional',
    info: {
      originSource: 'Character brand / media franchise',
      story:
        'Designed in 1974 by Yuko Shimizu for the Japanese company Sanrio, Hello Kitty debuted on a small vinyl coin purse. Her simple white face, signature bow, and deliberately expressionless look gave her a universal appeal that grew into a multi-billion-dollar global franchise spanning fashion, theme parks, and cross-media collaborations — one of the most recognised characters ever created.',
      universeFranchiseCreator: 'Sanrio, created by Yuko Shimizu',
      roleInStory: 'Mascot and central character',
      personalityTraits: ['Friendly', 'Kind', 'Cheerful'],
      abilitiesOrSpecialTraits: ['Global iconography', 'Cross-media adaptability'],
      firstAppearance: {
        year: '1974',
        work: 'Sanrio product line debut'
      }
    }
  },
  {
    name: 'Tom',
    cityOfOrigin: 'Los Angeles',
    latitude: 34.0522,
    longitude: -118.2437,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/tom.jpg',
    imageAlt: 'Tom from Tom and Jerry',
    category: 'fictional',
    info: {
      originSource: 'Animated short film series',
      story:
        "Tom made his debut in the 1940 MGM short Puss Gets the Boot, created by William Hanna and Joseph Barbera. In nearly every episode he pursues the clever mouse Jerry through a series of elaborate, physics-defying slapstick set-pieces — and almost never wins. His expressive suffering and determined restarts turned him into one of animation's most beloved comic foils.",
      universeFranchiseCreator: 'Tom and Jerry by William Hanna and Joseph Barbera',
      roleInStory: 'Main protagonist/antagonist depending on episode',
      personalityTraits: ['Determined', 'Competitive', 'Expressive'],
      abilitiesOrSpecialTraits: ['Cartoon slapstick resilience', 'Silent physical comedy'],
      firstAppearance: {
        year: '1940',
        work: 'Puss Gets the Boot'
      }
    }
  },
  {
    name: 'Puss in Boots',
    cityOfOrigin: 'Rome',
    latitude: 41.9028,
    longitude: 12.4964,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/pussinboots.jpg',
    imageAlt: 'Puss in Boots',
    category: 'fictional',
    info: {
      originSource: 'Animated film',
      story:
        'Puss in Boots first appeared in Shrek 2 (2004) as a suave hired assassin who weaponises an irresistibly adorable gaze. He quickly stole every scene he entered and earned two standalone DreamWorks films of his own. A master swordsman with a flair for the dramatic, he blends the swagger of a fairy-tale hero with the disarming charm of a very small cat in very big boots.',
      universeFranchiseCreator: 'Shrek universe by DreamWorks Animation',
      roleInStory: 'Heroic side character turned lead',
      personalityTraits: ['Confident', 'Dramatic', 'Charismatic'],
      abilitiesOrSpecialTraits: ['Master swordsman', 'Signature cute-eyed persuasion'],
      firstAppearance: {
        year: '2004',
        work: 'Shrek 2'
      }
    }
  },
  {
    name: 'Pusheen',
    cityOfOrigin: 'Chicago',
    latitude: 41.8781,
    longitude: -87.6298,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/pusheen.jpg',
    imageAlt: 'Pusheen',
    category: 'fictional',
    info: {
      originSource: 'Web comic and digital stickers',
      story:
        "Pusheen started life in 2010 as a chubby grey tabby in the Everyday Cute web comic by Claire Belton and Andrew Duff. She rose to worldwide fame as a digital sticker pack, becoming a staple of messaging apps everywhere. Whether baking, gaming, or simply napping, Pusheen's illustrated adventures perfectly capture the cosy, snack-loving contentment of the ideal internet cat.",
      universeFranchiseCreator: 'Pusheen by Claire Belton and Andrew Duff',
      roleInStory: 'Main character and mascot',
      personalityTraits: ['Playful', 'Cozy', 'Food-loving'],
      abilitiesOrSpecialTraits: ['Expressive sticker mascot', 'Multiple themed forms'],
      firstAppearance: {
        year: '2010',
        work: 'Everyday Cute web comic'
      }
    }
  },
  {
    name: 'Siamese',
    cityOfOrigin: 'Bangkok',
    latitude: 13.7563,
    longitude: 100.5018,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/siamese.jpg',
    imageAlt: 'Siamese cat breed',
    category: 'breed',
    info: {
      origin: 'Thailand (historically Siam)',
      history:
        'A naturally occurring breed documented in historic Thai manuscripts and later developed in Western breeding programs.',
      physicalCharacteristics: {
        size: 'Medium',
        coatType: 'Short',
        colorPatterns: ['Colorpoint', 'Seal point', 'Blue point', 'Chocolate point']
      },
      temperament: ['Social', 'Vocal', 'People-oriented'],
      careRequirements: {
        groomingNeeds: 'Low to moderate grooming; weekly brushing usually sufficient.',
        exerciseLevel: 'High mental and interactive play needs.',
        healthConsiderations: ['Monitor dental health', 'Watch weight and activity balance']
      },
      lifespan: '12-20 years',
      similarBreeds: ['Balinese', 'Oriental Shorthair']
    }
  },
  {
    name: 'Persian',
    cityOfOrigin: 'Tehran',
    latitude: 35.6892,
    longitude: 51.389,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/persian.jpg',
    imageAlt: 'Persian cat breed',
    category: 'breed',
    info: {
      origin: 'Iran (historically Persia)',
      history:
        'Long-haired cats from Persia influenced the development of the modern Persian through selective breeding in Europe.',
      physicalCharacteristics: {
        size: 'Medium to large',
        coatType: 'Long',
        colorPatterns: ['Solid', 'Tabby', 'Bicolor', 'Himalayan pattern']
      },
      temperament: ['Calm', 'Gentle', 'Companion-focused'],
      careRequirements: {
        groomingNeeds: 'High grooming needs; frequent combing to prevent matting.',
        exerciseLevel: 'Moderate indoor activity preferred.',
        healthConsiderations: ['Face and eye care', 'Breathing issues in flat-faced lines']
      },
      lifespan: '12-17 years',
      similarBreeds: ['Exotic Shorthair']
    }
  },
  {
    name: 'Maine Coon',
    cityOfOrigin: 'Portland',
    latitude: 43.6591,
    longitude: -70.2568,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/mainecoon.jpg',
    imageAlt: 'Maine Coon cat breed',
    category: 'breed',
    info: {
      origin: 'Maine, United States',
      history:
        'A natural breed from New England, valued historically for hardiness and moussing ability.',
      physicalCharacteristics: {
        size: 'Large',
        coatType: 'Long / shaggy',
        colorPatterns: ['Tabby', 'Solid', 'Bicolor', 'Tortoiseshell']
      },
      temperament: ['Friendly', 'Adaptable', 'Intelligent'],
      careRequirements: {
        groomingNeeds: 'Moderate to high grooming; regular brushing recommended.',
        exerciseLevel: 'Moderate to high; benefits from climbing and play.',
        healthConsiderations: ['Screening for hypertrophic cardiomyopathy', 'Joint health monitoring']
      },
      lifespan: '10-15 years',
      similarBreeds: ['Norwegian Forest', 'Siberian']
    }
  },
  {
    name: 'Norwegian Forest',
    cityOfOrigin: 'Oslo',
    latitude: 59.9139,
    longitude: 10.7522,
    iconUrl: '/imgs/meowrker.png',
    imageUrl: '/imgs/norwegianforest.jpg',
    imageAlt: 'Norwegian Forest cat breed',
    category: 'breed',
    info: {
      origin: 'Norway',
      history:
        'A natural Scandinavian breed adapted to cold climates and formalized in modern registries in the late 20th century.',
      physicalCharacteristics: {
        size: 'Large',
        coatType: 'Long / double coat',
        colorPatterns: ['Tabby', 'Solid', 'Bicolor', 'Tortoiseshell']
      },
      temperament: ['Independent', 'Gentle', 'Athletic'],
      careRequirements: {
        groomingNeeds: 'Moderate grooming with seasonal heavy shedding care.',
        exerciseLevel: 'Moderate to high; enjoys climbing and exploration.',
        healthConsiderations: ['Monitor joint and heart health over time']
      },
      lifespan: '12-16 years',
      similarBreeds: ['Maine Coon', 'Siberian']
    }
  }
];