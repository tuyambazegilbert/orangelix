/**
 * OrangeFlix Movie & Cinema Entity Knowledge Graph
 * Provides structured entity recognition for characters, cast/crew aliases,
 * movie franchises, genre synonyms, and semantic plot themes.
 */

export interface CharacterEntity {
  name: string;
  aliases: string[];
  actor: string;
  movies: string[];
  franchise?: string;
}

export interface PersonEntity {
  name: string;
  role: 'actor' | 'director' | 'creator';
  aliases: string[];
  knownFor: string[];
}

export interface FranchiseEntity {
  name: string;
  aliases: string[];
  topMovies: string[];
}

export interface SemanticTheme {
  theme: string;
  keywords: string[];
  recommendedTitles: string[];
}

export interface GenreAlias {
  canonical: string;
  id: string;
  aliases: string[];
}

// 1. CHARACTER KNOWLEDGE BASE
export const CHARACTER_ENTITIES: CharacterEntity[] = [
  {
    name: 'Tony Stark',
    aliases: ['iron man', 'ironman', 'tony stark', 'iron man 4', 'movies with iron man'],
    actor: 'Robert Downey Jr.',
    movies: [
      'Iron Man',
      'Iron Man 2',
      'Iron Man 3',
      'The Avengers',
      'Avengers: Age of Ultron',
      'Avengers: Infinity War',
      'Avengers: Endgame',
      'Captain America: Civil War',
      'Spider-Man: Homecoming',
    ],
    franchise: 'Marvel Cinematic Universe',
  },
  {
    name: 'Dom Cobb',
    aliases: ['dom cobb', 'cobb', 'dream thief'],
    actor: 'Leonardo DiCaprio',
    movies: ['Inception'],
    franchise: 'Christopher Nolan Cinema',
  },
  {
    name: 'Bruce Wayne',
    aliases: ['batman', 'dark knight', 'bruce wayne', 'caped crusader', 'batmn', 'movies with batman'],
    actor: 'Christian Bale / Robert Pattinson / Michael Keaton',
    movies: [
      'Batman Begins',
      'The Dark Knight',
      'The Dark Knight Rises',
      'The Batman',
      'Batman',
      'Batman Returns',
      'Batman v Superman: Dawn of Justice',
      'Batman Forever',
    ],
    franchise: 'Batman / DC',
  },
  {
    name: 'The Joker',
    aliases: ['joker', 'the joker', 'arthur fleck'],
    actor: 'Heath Ledger / Joaquin Phoenix',
    movies: ['The Dark Knight', 'Joker', 'Joker: Folie à Deux', 'The Batman', 'Batman'],
    franchise: 'DC',
  },
  {
    name: 'Peter Parker',
    aliases: ['spider man', 'spiderman', 'spider-man', 'peter parker', 'spidrman', 'spider man 2002', 'movies with spider man'],
    actor: 'Tobey Maguire / Tom Holland / Andrew Garfield',
    movies: [
      'Spider-Man',
      'Spider-Man 2',
      'Spider-Man 3',
      'Spider-Man: No Way Home',
      'Spider-Man: Into the Spider-Verse',
      'Spider-Man: Across the Spider-Verse',
      'The Amazing Spider-Man',
    ],
    franchise: 'Spider-Man',
  },
  {
    name: 'John Wick',
    aliases: ['john wick', 'baba yaga', 'john wick 4', 'john wick 3', 'john wick 2', 'john wick 1', 'john wick chapter 4'],
    actor: 'Keanu Reeves',
    movies: ['John Wick', 'John Wick: Chapter 2', 'John Wick: Chapter 3 - Parabellum', 'John Wick: Chapter 4'],
    franchise: 'John Wick',
  },
  {
    name: 'Jack Dawson',
    aliases: ['jack dawson', 'jack and rose'],
    actor: 'Leonardo DiCaprio',
    movies: ['Titanic'],
    franchise: 'James Cameron',
  },
  {
    name: 'Paul Atreides',
    aliases: ['paul atreides', 'muad dib', 'kwisatz haderach', 'dune'],
    actor: 'Timothée Chalamet',
    movies: ['Dune', 'Dune: Part Two'],
    franchise: 'Dune',
  },
  {
    name: 'J. Robert Oppenheimer',
    aliases: ['oppenheimer', 'robert oppenheimer', 'oppenheime'],
    actor: 'Cillian Murphy',
    movies: ['Oppenheimer'],
    franchise: 'Christopher Nolan Cinema',
  },
  {
    name: 'Neo',
    aliases: ['neo', 'the one', 'thomas anderson'],
    actor: 'Keanu Reeves',
    movies: ['The Matrix', 'The Matrix Reloaded', 'The Matrix Revolutions', 'The Matrix Resurrections'],
    franchise: 'The Matrix',
  },
  {
    name: 'Harry Potter',
    aliases: ['harry potter', 'the boy who lived'],
    actor: 'Daniel Radcliffe',
    movies: [
      'Harry Potter and the Sorcerer\'s Stone',
      'Harry Potter and the Chamber of Secrets',
      'Harry Potter and the Prisoner of Azkaban',
      'Harry Potter and the Goblet of Fire',
      'Harry Potter and the Order of the Phoenix',
      'Harry Potter and the Half-Blood Prince',
      'Harry Potter and the Deathly Hallows',
    ],
    franchise: 'Wizarding World',
  },
  {
    name: 'Luke Skywalker',
    aliases: ['luke skywalker', 'skywalker', 'darth vader', 'jedi', 'star wars'],
    actor: 'Mark Hamill',
    movies: [
      'Star Wars: Episode IV - A New Hope',
      'Star Wars: Episode V - The Empire Strikes Back',
      'Star Wars: Episode VI - Return of the Jedi',
      'Star Wars: The Force Awakens',
      'Star Wars: The Last Jedi',
    ],
    franchise: 'Star Wars',
  },
  {
    name: 'Wolverine',
    aliases: ['wolverine', 'logan', 'james howlett'],
    actor: 'Hugh Jackman',
    movies: ['Logan', 'Deadpool & Wolverine', 'X-Men: Days of Future Past', 'X-Men'],
    franchise: 'X-Men / Marvel',
  },
  {
    name: 'Deadpool',
    aliases: ['deadpool', 'wade wilson', 'merc with a mouth'],
    actor: 'Ryan Reynolds',
    movies: ['Deadpool', 'Deadpool 2', 'Deadpool & Wolverine'],
    franchise: 'Deadpool / Marvel',
  },
  {
    name: 'Jake Sully',
    aliases: ['avatar', 'jake sully', 'neytiri', 'avatr', 'avatar way of water', 'avatr way of wter', 'avatar 2'],
    actor: 'Sam Worthington',
    movies: ['Avatar', 'Avatar: The Way of Water'],
    franchise: 'Avatar',
  },
  {
    name: 'Barbie',
    aliases: ['barbie', 'stereotypical barbie'],
    actor: 'Margot Robbie',
    movies: ['Barbie'],
    franchise: 'Barbie',
  },
  {
    name: 'Ethan Hunt',
    aliases: ['ethan hunt', 'mission impossible'],
    actor: 'Tom Cruise',
    movies: ['Mission: Impossible - Fallout', 'Mission: Impossible - Dead Reckoning Part One', 'Mission: Impossible - Rogue Nation'],
    franchise: 'Mission: Impossible',
  },
  {
    name: 'Katniss Everdeen',
    aliases: ['katniss', 'katniss everdeen', 'mockingjay', 'the hunger games'],
    actor: 'Jennifer Lawrence',
    movies: ['The Hunger Games', 'The Hunger Games: Catching Fire', 'The Hunger Games: Mockingjay - Part 1'],
    franchise: 'The Hunger Games',
  },
];

// 2. PEOPLE & CREATORS KNOWLEDGE BASE (Actors, Directors, Aliases)
export const PERSON_ENTITIES: PersonEntity[] = [
  {
    name: 'Leonardo DiCaprio',
    role: 'actor',
    aliases: ['leonardo', 'dicaprio', 'leo dicaprio', 'leo', 'leondardo', 'leonardo dicaprio movies'],
    knownFor: [
      'Inception',
      'Titanic',
      'The Wolf of Wall Street',
      'The Revenant',
      'Shutter Island',
      'Catch Me If You Can',
      'Django Unchained',
      'The Departed',
      'Killers of the Flower Moon',
    ],
  },
  {
    name: 'Tom Hanks',
    role: 'actor',
    aliases: ['tom hanks', 'hanks', 'tom hank', 'tom hanks movies'],
    knownFor: [
      'Forrest Gump',
      'Cast Away',
      'Saving Private Ryan',
      'The Green Mile',
      'Apollo 13',
      'Toy Story',
      'Captain Phillips',
      'Catch Me If You Can',
    ],
  },
  {
    name: 'Christopher Nolan',
    role: 'director',
    aliases: ['nolan', 'christopher nolan', 'chris nolan', 'nolan movies', 'christopher nolan films'],
    knownFor: [
      'Inception',
      'Oppenheimer',
      'Interstellar',
      'The Dark Knight',
      'Batman Begins',
      'Tenet',
      'Memento',
      'Dunkirk',
      'The Prestige',
    ],
  },
  {
    name: 'Robert Downey Jr.',
    role: 'actor',
    aliases: ['rdj', 'robert downey', 'robert downey jr', 'downey jr', 'robert downey jr movies'],
    knownFor: ['Iron Man', 'The Avengers', 'Sherlock Holmes', 'Oppenheimer', 'Avengers: Endgame'],
  },
  {
    name: 'Keanu Reeves',
    role: 'actor',
    aliases: ['keanu', 'keanu reeves', 'keanu reeves movies'],
    knownFor: ['The Matrix', 'John Wick', 'Speed', 'Constantine', 'Point Break'],
  },
  {
    name: 'Denzel Washington',
    role: 'actor',
    aliases: ['denzel', 'denzel washington', 'denzel washington movies'],
    knownFor: ['Training Day', 'The Equalizer', 'Gladiator II', 'Flight', 'Man on Fire', 'American Gangster'],
  },
  {
    name: 'Dwayne Johnson',
    role: 'actor',
    aliases: ['the rock', 'rock', 'dwayne johnson'],
    knownFor: ['Black Adam', 'Moana', 'Jumanji: Welcome to the Jungle', 'Fast Five', 'Red Notice'],
  },
  {
    name: 'Quentin Tarantino',
    role: 'director',
    aliases: ['tarantino', 'quentin tarantino', 'tarantino movies'],
    knownFor: [
      'Pulp Fiction',
      'Django Unchained',
      'Inglourious Basterds',
      'Kill Bill',
      'Once Upon a Time in Hollywood',
      'Reservoir Dogs',
    ],
  },
  {
    name: 'Steven Spielberg',
    role: 'director',
    aliases: ['spielberg', 'steven spielberg'],
    knownFor: [
      'Jurassic Park',
      'Schindler\'s List',
      'Saving Private Ryan',
      'E.T. the Extra-Terrestrial',
      'Jaws',
      'Raiders of the Lost Ark',
      'Catch Me If You Can',
    ],
  },
  {
    name: 'Martin Scorsese',
    role: 'director',
    aliases: ['scorsese', 'martin scorsese', 'scorsese movies'],
    knownFor: [
      'The Wolf of Wall Street',
      'Goodfellas',
      'Taxi Driver',
      'The Departed',
      'Killers of the Flower Moon',
      'Shutter Island',
      'Casino',
    ],
  },
  {
    name: 'Adam Sandler',
    role: 'actor',
    aliases: ['adam sandler', 'sandler', 'adam sandler movies'],
    knownFor: ['Happy Gilmore', 'Uncut Gems', 'Hustle', 'Click', 'Murder Mystery', '50 First Dates', 'Billy Madison'],
  },
  {
    name: 'Tom Cruise',
    role: 'actor',
    aliases: ['tom cruise', 'cruise', 'tom cruise movies'],
    knownFor: ['Top Gun: Maverick', 'Mission: Impossible', 'Edge of Tomorrow', 'Minority Report', 'Jerry Maguire'],
  },
  {
    name: 'Zendaya',
    role: 'actor',
    aliases: ['zendaya', 'zendaya coleman'],
    knownFor: ['Dune', 'Dune: Part Two', 'Spider-Man: No Way Home', 'Challengers', 'Euphoria', 'The Greatest Showman'],
  },
  {
    name: 'Denis Villeneuve',
    role: 'director',
    aliases: ['villeneuve', 'denis villeneuve'],
    knownFor: ['Dune', 'Dune: Part Two', 'Blade Runner 2049', 'Arrival', 'Sicario', 'Prisoners'],
  },
  {
    name: 'James Cameron',
    role: 'director',
    aliases: ['james cameron', 'cameron'],
    knownFor: [
      'Avatar',
      'Avatar: The Way of Water',
      'Titanic',
      'The Terminator',
      'Terminator 2: Judgment Day',
      'Aliens',
    ],
  },
  {
    name: 'Cillian Murphy',
    role: 'actor',
    aliases: ['cillian murphy', 'cillian'],
    knownFor: ['Oppenheimer', 'Peaky Blinders', 'Inception', '28 Days Later', 'Dunkirk'],
  },
  {
    name: 'Margot Robbie',
    role: 'actor',
    aliases: ['margot robbie', 'margot'],
    knownFor: ['Barbie', 'The Wolf of Wall Street', 'Birds of Prey', 'I, Tonya', 'Babylon'],
  },
  {
    name: 'Christian Bale',
    role: 'actor',
    aliases: ['christian bale', 'bale'],
    knownFor: ['The Dark Knight', 'Batman Begins', 'American Psycho', 'The Prestige', 'Ford v Ferrari'],
  },
  {
    name: 'Timothée Chalamet',
    role: 'actor',
    aliases: ['timothee chalamet', 'chalamet', 'timothee'],
    knownFor: ['Dune', 'Dune: Part Two', 'Wonka', 'Call Me by Your Name', 'Little Women', 'Interstellar'],
  },
  {
    name: 'Rocky Kimomo',
    role: 'creator',
    aliases: ['rocky kimomo', 'rocky', 'kimomo'],
    knownFor: ['Agasobanuye Cinema', 'Action Interpreted Hits', 'Rwanda Cinema'],
  },
];

// 3. FRANCHISE KNOWLEDGE BASE
export const FRANCHISE_ENTITIES: FranchiseEntity[] = [
  {
    name: 'Marvel Cinematic Universe',
    aliases: ['mcu', 'marvel', 'marvel cinematic universe', 'marvel movies', 'the avengers'],
    topMovies: ['The Avengers', 'Avengers: Endgame', 'Avengers: Infinity War', 'Iron Man', 'Black Panther', 'Spider-Man: No Way Home', 'Guardians of the Galaxy'],
  },
  {
    name: 'DC Universe',
    aliases: ['dc', 'dcu', 'dceu', 'dc extended universe', 'dc comics', 'batman franchise'],
    topMovies: ['The Dark Knight', 'The Batman', 'Joker', 'Man of Steel', 'Wonder Woman', 'Zack Snyder\'s Justice League'],
  },
  {
    name: 'Star Wars',
    aliases: ['star wars', 'starwars', 'lucasfilm', 'star wars franchise'],
    topMovies: ['Star Wars: Episode IV - A New Hope', 'Star Wars: Episode V - The Empire Strikes Back', 'Star Wars: The Force Awakens', 'Rogue One: A Star Wars Story'],
  },
  {
    name: 'Harry Potter & Wizarding World',
    aliases: ['harry potter', 'wizarding world', 'potterverse'],
    topMovies: ['Harry Potter and the Sorcerer\'s Stone', 'Harry Potter and the Prisoner of Azkaban', 'Harry Potter and the Deathly Hallows', 'Fantastic Beasts and Where to Find Them'],
  },
  {
    name: 'The Lord of the Rings',
    aliases: ['lord of the rings', 'lotr', 'middle earth', 'the hobbit'],
    topMovies: ['The Lord of the Rings: The Fellowship of the Ring', 'The Lord of the Rings: The Two Towers', 'The Lord of the Rings: The Return of the King'],
  },
  {
    name: 'Fast & Furious',
    aliases: ['fast and furious', 'fast & furious', 'fast furious', 'fast 9', 'fast x'],
    topMovies: ['Fast Five', 'Furious 7', 'The Fast and the Furious', 'Fast X'],
  },
];

// 4. GENRE ALIASES & SYNONYMS
export const GENRE_ALIASES: GenreAlias[] = [
  {
    canonical: 'Action',
    id: '28',
    aliases: ['action', 'action movie', 'action movies', 'blockbuster', 'stunts', 'explosive', 'martial arts', 'fighting'],
  },
  {
    canonical: 'Adventure',
    id: '12',
    aliases: ['adventure', 'adventures', 'expedition', 'journey', 'quest', 'treasure hunt'],
  },
  {
    canonical: 'Animation',
    id: '16',
    aliases: ['animation', 'animated', 'anime', 'cartoon', 'cartoons', 'pixar', 'disney animated', 'cgi'],
  },
  {
    canonical: 'Comedy',
    id: '35',
    aliases: ['comedy', 'comedies', 'comdy', 'funny', 'humor', 'hilarious', 'laugh', 'satire', 'spoof', 'standup', 'comedic', 'funny movies'],
  },
  {
    canonical: 'Crime',
    id: '80',
    aliases: ['crime', 'gangster', 'mafia', 'heist', 'robbery', 'police', 'detective', 'detectives', 'underworld'],
  },
  {
    canonical: 'Documentary',
    id: '99',
    aliases: ['documentary', 'documentaries', 'doc', 'docs', 'true story', 'biography doc', 'real life'],
  },
  {
    canonical: 'Drama',
    id: '18',
    aliases: ['drama', 'dramas', 'dramatic', 'emotional', 'tearjerker', 'character study'],
  },
  {
    canonical: 'Family',
    id: '10751',
    aliases: ['family', 'kids', 'children', 'family friendly', 'all ages'],
  },
  {
    canonical: 'Fantasy',
    id: '14',
    aliases: ['fantasy', 'magic', 'wizards', 'mythical', 'fairy tale', 'dragons', 'sorcery'],
  },
  {
    canonical: 'History',
    id: '36',
    aliases: ['history', 'historical', 'period piece', 'ancient', 'world war', 'biopic', 'medieval'],
  },
  {
    canonical: 'Horror',
    id: '27',
    aliases: ['horror', 'scary', 'spooky', 'ghost', 'ghosts', 'monsters', 'slasher', 'supernatural', 'jumpscare', 'paranormal', 'zombie', 'zombies', 'best horror movies'],
  },
  {
    canonical: 'Music',
    id: '10402',
    aliases: ['music', 'musical', 'musicals', 'concert', 'soundtrack', 'songs', 'singing', 'band', 'rock opera'],
  },
  {
    canonical: 'Mystery',
    id: '9648',
    aliases: ['mystery', 'mysteries', 'whodunit', 'unsolved', 'investigation', 'puzzle', 'clues'],
  },
  {
    canonical: 'Romance',
    id: '10749',
    aliases: ['romance', 'romantic', 'love story', 'romcom', 'rom com', 'romantic comedy', 'dating', 'lovers'],
  },
  {
    canonical: 'Science Fiction',
    id: '878',
    aliases: ['science fiction', 'sci fi', 'scifi', 'sci-fi', 'space', 'aliens', 'cyberpunk', 'futuristic', 'time travel', 'multiverse', 'ai', 'artificial intelligence', 'robots', 'galaxy'],
  },
  {
    canonical: 'Thriller',
    id: '53',
    aliases: ['thriller', 'thrillers', 'suspense', 'psychological', 'nail biting', 'intense', 'plot twist'],
  },
  {
    canonical: 'War',
    id: '10752',
    aliases: ['war', 'military', 'soldiers', 'army', 'battle', 'combat', 'world war 2', 'ww2', 'vietnam'],
  },
  {
    canonical: 'Western',
    id: '37',
    aliases: ['western', 'cowboy', 'cowboys', 'wild west', 'outlaw', 'gunslinger', 'sheriff'],
  },
];

// 5. SEMANTIC / THEMATIC PLOT CONCEPT ASSOCIATIONS
export const SEMANTIC_THEMES: SemanticTheme[] = [
  {
    theme: 'Dreams within Dreams / Subconscious Heist',
    keywords: [
      'dreams inside dreams',
      'dream inside dream',
      'enter dreams',
      'entering dreams',
      'dreams within dreams',
      'movie with dreams',
      'movie with leonardo and dreams',
      'subconscious heist',
      'shared dreaming',
      'that movie with leonardo and dreams',
    ],
    recommendedTitles: ['Inception', 'Paprika', 'Shutter Island', 'The Matrix'],
  },
  {
    theme: 'Time Loop / Repeating Same Day',
    keywords: [
      'time loop',
      'stuck in a time loop',
      'repeat same day',
      'reliving the same day',
      'repeating day',
      'groundhog day loop',
      'guy stuck in a time loop',
      'movie about a guy stuck in a time loop',
    ],
    recommendedTitles: ['Edge of Tomorrow', 'Groundhog Day', 'Palm Springs', 'Happy Death Day', 'Source Code'],
  },
  {
    theme: 'Space Exploration / Black Holes / Relativistic Time',
    keywords: [
      'space and time',
      'movies about space and time',
      'black hole',
      'wormhole',
      'relativity',
      'interstellar travel',
      'deep space',
      'astronauts stranded',
      'space time',
      'movie about space and time',
    ],
    recommendedTitles: ['Interstellar', '2001: A Space Odyssey', 'Gravity', 'The Martian', 'Ad Astra', 'Arrival'],
  },
  {
    theme: 'Simulated Reality / Virtual World',
    keywords: ['simulated reality', 'simulation', 'virtual reality', 'red pill blue pill', 'ai takeover', 'matrix'],
    recommendedTitles: ['The Matrix', 'The Truman Show', 'Ready Player One', 'Free Guy', 'Dark City', 'eXistenZ'],
  },
  {
    theme: 'Mind-Bending Psychological Plot Twists',
    keywords: ['mind bending', 'plot twist', 'psychological twist', 'unreliable narrator', 'insane asylum twist', 'mind fuck'],
    recommendedTitles: ['Shutter Island', 'Fight Club', 'The Prestige', 'The Sixth Sense', 'Memento', 'Gone Girl', 'Primal Fear'],
  },
  {
    theme: 'Dinosaur Theme Park Disaster',
    keywords: ['dinosaurs', 'dinosaur theme park', 't rex', 'jurassic', 'cloned dinosaurs'],
    recommendedTitles: ['Jurassic Park', 'The Lost World: Jurassic Park', 'Jurassic World', 'Jurassic World: Fallen Kingdom'],
  },
  {
    theme: 'Ocean Liner Iceberg Sinking & Romance',
    keywords: ['ship sinking', 'iceberg ship', 'titanic ship', 'jack and rose ship', 'ship hits an iceberg'],
    recommendedTitles: ['Titanic'],
  },
  {
    theme: 'Post-Apocalyptic Survival & Wasteland',
    keywords: ['post apocalyptic', 'wasteland', 'nuclear winter', 'end of the world', 'zombie apocalypse'],
    recommendedTitles: ['Mad Max: Fury Road', 'A Quiet Place', 'I Am Legend', 'The Road', '28 Days Later', 'Children of Men'],
  },
  {
    theme: 'High Stakes Bank Heist / Master Thieves',
    keywords: ['bank heist', 'heist movie', 'master robbery', 'stealing gold', 'vault breakin'],
    recommendedTitles: ['Heat', 'Ocean\'s Eleven', 'The Italian Job', 'Inside Man', 'The Town', 'Baby Driver'],
  },
  {
    theme: 'Retired Assassin Revenge & Action',
    keywords: ['revenge for a dog', 'retired assassin', 'assassin dog', 'baba yaga', 'hitman vengeance'],
    recommendedTitles: ['John Wick', 'Nobody', 'The Equalizer', 'Man on Fire'],
  },
  {
    theme: 'Dystopian Arena Battle Survival',
    keywords: ['arena survival', 'kids fighting in arena', 'hunger games arena', 'battle royale'],
    recommendedTitles: ['The Hunger Games', 'The Hunger Games: Catching Fire', 'Battle Royale', 'The Maze Runner'],
  },
];

// 6. REGIONAL / AFRICAN CINEMA DOMAIN KEYWORDS
export const AFRICAN_CINEMA_ENTITIES = [
  'agasobanuye',
  'agasobanuye movies',
  'rocky kimomo',
  'junior giti',
  'sankara',
  'yanga',
  'savimbi',
  'nollywood',
  'nigerian movies',
  'ghallywood',
  'ghanaian movies',
  'bongo movie',
  'tanzanian movies',
  'riverwood',
  'kenyan cinema',
  'kinyarwanda cinema',
  'swahili cinema',
  'african cinema',
];
