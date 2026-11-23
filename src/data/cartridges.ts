export type CartridgeKind = 'reminders' | 'minigame' | 'letters' | 'music';

export interface SdCartridge {
  id: CartridgeKind;
  label: string;
  filename: string;
  capacity: string;
  badge: string;
  accentGradient: string;
}

export const SD_CARTRIDGES: SdCartridge[] = [
  {
    id: 'reminders',
    label: 'CIYI MEMORY CARD',
    filename: 'LOVE_ARCHIVE.dat',
    capacity: '64MB',
    badge: '01 · ARCHIVE',
    accentGradient: 'from-[#CBD5E1] via-[#BAE6FD] to-[#7DD3FC]',
  },
  {
    id: 'minigame',
    label: 'PIXEL ARCADE',
    filename: 'HEART_GAME.rom',
    capacity: '32MB',
    badge: '02 · GAME',
    accentGradient: 'from-[#E2E8F0] via-[#A5F3FC] to-[#38BDF8]',
  },
  {
    id: 'letters',
    label: 'SECRET LETTERS',
    filename: 'LOVE_LETTERS.txt',
    capacity: '16MB',
    badge: '03 · MAIL',
    accentGradient: 'from-[#F1F5F9] via-[#C7D2FE] to-[#93C5FD]',
  },
  {
    id: 'music',
    label: 'CHILL MIXTAPE',
    filename: 'CIYI_TUNES.wav',
    capacity: '128MB',
    badge: '04 · AUDIO',
    accentGradient: 'from-[#E2E8F0] via-[#99F6E4] to-[#7DD3FC]',
  },
];

export interface LoveLetter {
  id: string;
  code: string;
  title: string;
  salutation: string;
  body: string[];
  signoff: string;
}

export const CIYI_LOVE_LETTERS: LoveLetter[] = [
  {
    id: 'let-01',
    code: 'LTR_01',
    title: 'WHY YOU ARE SPECIAL',
    salutation: 'Dear Ciyi,',
    body: [
      'You probably do not notice it, but the way you care about the little things makes everyone around you feel safe—especially me.',
      'Even your quietest moments feel like my favorite place to be. Thank you for bringing so much warmth into my ordinary days.',
    ],
    signoff: 'Always yours ♡',
  },
  {
    id: 'let-02',
    code: 'LTR_02',
    title: 'FOR HARD DAYS',
    salutation: 'Hey my love,',
    body: [
      'If today feels heavy or tiring, please pause and take a deep breath. You do not have to carry everything by yourself.',
      'Lean on me whenever you need to rest. I am right here in your corner, cheering for you every single day.',
    ],
    signoff: 'With all my heart ♡',
  },
  {
    id: 'let-03',
    code: 'LTR_03',
    title: 'MY LITTLE PROMISE',
    salutation: 'To my favorite girl,',
    body: [
      'I promise to keep choosing you in the small moments—listening to your stories, making you laugh, and reminding you how precious you are.',
      'No matter how busy life gets, you will always be my priority.',
    ],
    signoff: 'Forever rooting for you ♡',
  },
  {
    id: 'let-04',
    code: 'LTR_04',
    title: 'OPEN WHEN YOU MISS ME',
    salutation: 'Hi Ciyi,',
    body: [
      'If we cannot talk right this second and you miss me, look at this screen and remember I am probably thinking about you too.',
      'Drink some water, smile a little, and save a big hug for the next time we meet.',
    ],
    signoff: 'See you soon ♡',
  },
];

export interface MusicTrack {
  id: string;
  number: string;
  title: string;
  artist: string;
  src: string;
}

export const CIYI_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-01',
    number: '01',
    title: 'The Most Beautiful Thing',
    artist: 'Bruno Major',
    src: '/assets/aistudio/Bruno_Major_-_The_Most_Beautiful_Thing__Lyric___Chord_Video__cdfb09db.mp3',
  },
  {
    id: 'track-02',
    number: '02',
    title: 'ONLY',
    artist: 'LeeHi',
    src: '/assets/aistudio/LeeHi_-_ONLY__Lyrics__53865da8.mp3',
  },
  {
    id: 'track-03',
    number: '03',
    title: 'Nothing',
    artist: 'Bruno Major',
    src: '/assets/aistudio/Bruno_Major_-_Nothing__Lyric___Chord_Video__73cbd732.mp3',
  },
  {
    id: 'track-04',
    number: '04',
    title: "I Just Couldn't Save You Tonight",
    artist: 'Ardhito Pramono ft. Aurélie',
    src: '/assets/aistudio/Ardhito_Pramono_ft._Aur_lie_Moeremans_-_I_Just_Couldn_t_Save_You_Tonight__Story_of_Kale_-_OMPS__8b95f50b.mp3',
  },
];
