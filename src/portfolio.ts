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
  title: string;
  shortTitle?: string;
  body?: string;
  backgroundSrc?: string;
  images?: PortfolioImage[];
  links?: PortfolioLink[];
  arrowSrc?: string;
  children: PortfolioNode[];
};

const portfolioTree: PortfolioNode = {
  id: 'root',
  type: 'text',
  title: 'Welcome',
  body: "Hi, I'm Felix, a second year economics student at UCL with a passion for technology. This is a site I built with three.js to display some of my projects. I hope you enjoy...",
  children: [
    {
      id: 'sudokusmart',
      type: 'text',
      title: 'SudokuSmart',
      body: 'As a school project, I built a mobile interface that could offer guidance on any sudoku. At the time, I was playing lots of mobile sudoku apps but was disappointed with their help features. After teaching myself Swift, I published SudokuSmart iOS in December 2024. Later, I learnt how to integrate Firebase and cloud functions. Now, the app has over 2,500 first-time downloads, over 100 ratings worldwide (averaging 4.7/5 stars) and countless features over the mainstream, including friends and global leaderboards. I still update the app every month, bringing new content and improvements.',
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
      body: "In October 2025 I was appointed Technology Executive for UCL's Economics & Finance Society. In this role, I completely rebuilt a flawed ticketing system, saving the society over $200/month. This work was rewarded with my appointment to Director of Technology in May earlier this year. In this role, I have already moved the website from Webflow to JS+React (~$300 annuall savings), and begun work on the society's first internal website, including an events management system, reimbursements tracker, and analytics dashboard.",
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
      title: 'Freelance projects',
      shortTitle: 'Other',
      body: 'Since 2026 summer I have been building websites as an amateur freelancer. Combining my expertise across ideation and implementation, I have designed and built digital websites for people in my close network.',
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
    {
      id: 'contact',
      type: 'links',
      title: 'Contact',
      links: [{
          imageSrc: '/mail.webp',
          label: 'Email',
          url: 'mailto:felixemile23@icloud.com',
        },
        {
          imageSrc: '/linkedin.webp',
          label: 'LinkedIn',
          url: 'https://www.linkedin.com/in/felixejohnson',
        },        
      ],
      children: [],
    },
  ],
  
};

export default portfolioTree;