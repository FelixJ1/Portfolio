export type PortfolioImage = {
  src: string;
  alt: string;
};

export type PortfolioLink = {
  imageSrc: string;
  label: string;
  url: string;
};

export type PortfolioNode = {
  id: string;
  type: string;
  title?: string;
  body?: string;
  backgroundSrc?: string;
  images?: PortfolioImage[];
  links?: PortfolioLink[];
  children: PortfolioNode[];
};

const portfolioTree: PortfolioNode = {
  id: 'root',
  type: 'text',
  title: 'Welcome',
  body: 'I am a second year economics student at UCL with a passion for technology. This is a site I built with three.js to display some of my projects and experience. I hope you enjoy...',
  children: [
    {
      id: 'sudokusmart',
      type: 'text',
      title: 'SudokuSmart',
      body: 'An iOS Sudoku application built with SwiftUI and SwiftData.',
      backgroundSrc: '/sudokusmartMonotone.svg',
      children: [
        {
          id: 'stack',
          type: 'images',
          title: 'Stack',
          images: [{
              src: '/swift.png',
              alt: 'Swift',
            },
            {
              src: '/swiftui.png',
              alt: 'SwiftUI',
            },
            {
              src: '/coreml.png',
              alt: 'CoreML',
            },
            {
              src: '/firebase.webp',
              alt: 'Firebase',
            },
            {
              src: '/python.webp',
              alt: 'Python',
            },
            
          ],
          children: [],
        },
        {
          id: 'links',
          type: 'links',
          title: 'Links',
          links: [
            {
              imageSrc: '/sudokusmartWeb.svg',
              label: 'SudokuSmart webpage',
              url: 'https://sudokusmart.com/',
            },
            {
              imageSrc: '/sudokusmartMobile.svg',
              label: 'SudokuSmart app',
              url: 'https://apps.apple.com/gb/app/sudokusmart/id6738646281',
            },
          ],
          children: [],
        },
      ],
    },
    {
      id: 'ucl-efs',
      type: 'text',
      title: 'UCL EFS',
      body: 'Economics and Finance Society.',
      backgroundSrc: '/efsMonotone.svg',
      children: [
        {
          id: 'stack',
          type: 'images',
          title: 'Stack',
          images: [{
              src: '/javascript.webp',
              alt: 'JavaScript',
            },
            {
              src: '/react.webp',
              alt: 'React',
            },
            {
              src: '/firebase.webp',
              alt: 'Firebase',
            },
            {
              src: '/python.webp',
              alt: 'Python',
            },
            {
              src: '/calendar.webp',
              alt: 'Google Calendar API',
            },
          ],
          children: [],
        },
        {
          id: 'links',
          type: 'links',
          title: 'Links',
          links: [
            {
              imageSrc: '/efsLogo.svg',
              label: 'Economics & Finance Society',
              url: 'https://ucl-efs.com/',
            },
            {
              imageSrc: '/bcLogo.svg',
              label: 'Bloomsbury Capital',
              url: 'https://ucl-efs.com/bloomsbury-capital',
            },
          ],
          children: [],
        },
      ],
    },
    {
      id: 'web-development',
      type: 'text',
      title: 'Other websites',
      body: 'Responsive websites and interactive front-end experiences built with React and JavaScript.',
      children: [
        {
          id: 'links',
          type: 'links',
          title: 'Links',
          links: [
            {
              imageSrc: '/iefLogo.svg',
              label: 'IEF Consulting',
              url: 'https://iefconsulting.co.uk/',
            },
          ],
          children: [],
        },
                {
          id: 'stack',
          type: 'images',
          title: 'Stack',
          images: [{
              src: '/javascript.webp',
              alt: 'JavaScript',
            },
            {
              src: '/react.webp',
              alt: 'React',
            },
            {
              src: '/threejs.webp',
              alt: 'Three.js',
            },
            {
              src: '/figma.webp',
              alt: 'Figma',
            },
          ],
          children: [],
        },
      ],
    },
  ],
};

export default portfolioTree;