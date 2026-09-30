import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import portfolioTree from './portfolio';
import { PortfolioBall } from './PortfolioBall';
import { navigationReducer } from './navigation';


const FADE_MS = 260;

type FaceType = 'hexagon' | 'pentagon';

type ImageContent = {
  src: string;
  alt: string;
};

type LinkContent = {
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
  images?: ImageContent[];
  links?: LinkContent[];
  children: PortfolioNode[];
};

type NavigationState = {
  nodes: PortfolioNode[];
  faceId: number;
};

type ChildNavigationOption = {
  type: 'child';
  id: string;
  title: string;
  shortTitle?: string;
  src?: string; 
  node: PortfolioNode;
};

type BackNavigationOption = {
  type: 'back';
  id: '__back__';
  title: string;
  shortTitle?: string;
  src?: string; 
};

type NavigationOption = ChildNavigationOption | BackNavigationOption;

type Arrow = {
  edgeIndex: number;
  neighborId: number;
  x: number;
  y: number;
  angle: number;
};

type ContentBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type VisibleArrow = Arrow & {
  option: NavigationOption;
};

type PendingChildNavigation = {
  type: 'child';
  node: PortfolioNode;
  faceId: number;
};

type PendingBackNavigation = {
  type: 'back';
  faceId: number;
};

type PendingResetNavigation = {
  type: 'reset';
  faceId: number;
};

type PendingNavigation =
  | PendingChildNavigation
  | PendingBackNavigation
  | PendingResetNavigation;

function makeInitialNavigation(): NavigationState {
  return {
    nodes: [portfolioTree],
    faceId: 0,
  };
}

export default function App(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ballRef = useRef<PortfolioBall | null>(null);
  const interactionLockedRef = useRef<boolean>(true);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);

  const [navigation, dispatchNavigation] = useReducer(
    navigationReducer,
    undefined,
    makeInitialNavigation,
  );
  const [faceType, setFaceType] = useState<FaceType>('hexagon');
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [box, setBox] = useState<ContentBox | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  const currentNode = navigation.nodes[navigation.nodes.length - 1];
  const isAtRoot = navigation.nodes.length === 1;

  const refreshFaceUI = useCallback((faceId: number): void => {
    const ball = ballRef.current;
    const el = containerRef.current;
    if (!ball || !el) return;

    const minSide = Math.min(el.clientWidth, el.clientHeight);
    setUiScale(Math.min(1, Math.max(0.65, minSide / 800)));
    setLabelGap(el.clientWidth > 800 ? 16 : 8)

    setFaceType(ball.getFaceType(faceId) as FaceType);
    setArrows(ball.getFaceEdgeArrows(faceId));
    setBox(ball.getFaceContentBox(faceId));
  }, []);

  const finishPendingNavigation = useCallback((): void => {
    const pending = pendingNavigationRef.current;
    if (!pending) return;

    pendingNavigationRef.current = null;

    if (pending.type === 'child') {
      dispatchNavigation({
        type: 'ENTER_CHILD',
        node: pending.node,
        faceId: pending.faceId,
      });
    } else if (pending.type === 'back') {
      dispatchNavigation({
        type: 'GO_BACK',
        faceId: pending.faceId,
      });
    } else if (pending.type === 'reset') {
      dispatchNavigation({
        type: 'RESET',
        root: portfolioTree,
        faceId: pending.faceId,
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ball = new PortfolioBall(containerRef.current, {
      onFrontFaceChange: (id: number) => {
        refreshFaceUI(id);
        setVisible(true);
        interactionLockedRef.current = false;
        finishPendingNavigation();
      },
      onAnimatingChange: (animating: boolean) => {
        if (animating) interactionLockedRef.current = true;
      },
      onIntroComplete: () => {
        const currentBall = ballRef.current;
        if (!currentBall) return;

        refreshFaceUI(currentBall.getFrontFaceId());
        setVisible(true);
        interactionLockedRef.current = false;
      },
    });

    ballRef.current = ball;
    refreshFaceUI(ball.getFrontFaceId());

    const onResize = (): void => {
      window.requestAnimationFrame(() => {
        const currentBall = ballRef.current;
        if (currentBall) {
          refreshFaceUI(currentBall.getFrontFaceId());
        }
      });
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ball.dispose();
      ballRef.current = null;
    };
  }, [finishPendingNavigation, refreshFaceUI]);

  const navigationOptions = useMemo<NavigationOption[]>(() => {
    const options: NavigationOption[] = currentNode.children.map(
      (node): ChildNavigationOption => ({
        type: 'child',
        id: node.id,
        title: node.title,
        shortTitle: node.shortTitle ?? node.title,
        src: node.backgroundSrc,
        node,
      }),
    );

    if (!isAtRoot) {
      options.unshift({
        type: 'back',
        id: '__back__',
        title: 'Back',
        shortTitle: 'Back',
      });
    }

    return options;
  }, [currentNode, isAtRoot]);

  const visibleArrows = useMemo<VisibleArrow[]>(() => {
    return arrows.slice(0, navigationOptions.length).map((arrow, index) => ({
      ...arrow,
      option: navigationOptions[index],
    }));
  }, [arrows, navigationOptions]);

  const handleArrowClick = (arrow: VisibleArrow): void => {
    if (interactionLockedRef.current) return;

    const targetFaceId = arrow.neighborId;

    interactionLockedRef.current = true;
    setVisible(false);

    if (arrow.option.type === 'child') {
      pendingNavigationRef.current = {
        type: 'child',
        node: arrow.option.node,
        faceId: targetFaceId,
      };
    } else {
      pendingNavigationRef.current = {
        type: 'back',
        faceId: targetFaceId,
      };
    }

    window.setTimeout(() => {
      ballRef.current?.rotateToFace(targetFaceId);
    }, FADE_MS);
  };

  const handleReset = (): void => {
    if (interactionLockedRef.current || isAtRoot) return;

    const rootFaceId = 0;

    interactionLockedRef.current = true;
    setVisible(false);
    pendingNavigationRef.current = {
      type: 'reset',
      faceId: rootFaceId,
    };

    window.setTimeout(() => {
      ballRef.current?.rotateToFace(rootFaceId);
    }, FADE_MS);
  };

  function NodeView({ node, box }: { node: PortfolioNode, box: ContentBox }) {
  switch (node.type) {
    case "text":
      return (
        <div
          className={`content-panel ${visible ? '' : 'is-hidden'}`}
          style={{
            left: `${box.left * 100}%`,
            top: `${box.top * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
            color: fgColor,
          }}
        >
          <div
            className={`content-panel-bg ${isPentagon ? 'pentagon' : ''}`}
            style={{
              backgroundImage: `url("${node.backgroundSrc}")`,
              opacity: 0.05,
            }}
          />
          <div className="content-panel-body">
            <h1>{currentNode.title}</h1>
            <p>{node.body}</p>
          </div>
        </div>
    )

    case "links":
      return (
        <div
          className={`content-panel ${visible ? '' : 'is-hidden'}`}
          style={{
            left: `${box.left * 100}%`,
            top: `${box.top * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
            color: fgColor,
          }}
        >
        <div className="grid-2">
          {node.links?.map((link) => (
            <a href={link.url} target="_blank" rel="noreferrer" key={link.url} className="grid-item">
              <img src={link.imageSrc} className="grid-image"/>
              <div className="grid-link" style={{color: fgColor}}>
                {link.label}
                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="216 104 215.99 40.01 152 40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="136" y1="120" x2="216" y2="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M184,136v72a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8h72" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>              </div>
            </a>
          ))}
        </div>
        </div>
      );

    case "images":
      return (
          <div
          className={`content-panel ${visible ? '' : 'is-hidden'}`}
          style={{
            left: `${box.left * 100}%`,
            top: `${box.top * 90}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
            color: fgColor,
            gap: '2rem',
          }}
        >
        <h1>{currentNode.title}</h1>


        <div className="grid-3">
          {node.images?.map((image) => (
            <div key={image.alt} className="grid-item">
              <img src={image.src} className="grid-image"/>
              {image.alt}
            </div>
          ))}
        </div>
        </div>
      );

    default: {
      return null;
    }
  }
}

  const [uiScale, setUiScale] = useState(1);
  const [labelGap, setLabelGap] = useState(16);
  const isPentagon = faceType === 'pentagon';
  const fgColor = isPentagon ? '#f5f5f0' : '#101012';

  const LABEL_SIDE = -1;

  return (
    <div className="app-root" style={{ '--ui': uiScale } as React.CSSProperties}>
      <div ref={containerRef} className="ball-canvas" />

{visibleArrows.map((arrow) => {
  const rad = (arrow.angle * Math.PI) / 180;
  const ux = Math.cos(rad) * LABEL_SIDE;
  const uy = Math.sin(rad) * LABEL_SIDE;

  return (
    <button
      key={`${arrow.neighborId}-${arrow.option.id}`}
      className={`edge-arrow-group ${visible ? '' : 'is-hidden'}`}
      onClick={() => handleArrowClick(arrow)}
      style={{
        position: 'absolute',
        left: `calc(${arrow.x * 100}% - var(--hit) / 2)`,
        top:  `calc(${arrow.y * 100}% - var(--hit) / 2)`,
        color: fgColor,
      }}
    >
      <div
        className="edge-arrow"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: `translate(-50%, -50%) rotate(${arrow.angle}deg)`,
        }}
      >
        <svg viewBox="0 0 24 24"  aria-hidden="true">
          <path
            d="M4 12h14M12 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        className="edge-arrow-label"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          right: 'auto',
          bottom: 'auto',
          transform:
            `translate(${ux * labelGap}px, ${uy * labelGap}px) ` +
            `translate(${-50 + ux * 50}%, ${-50 + uy * 50}%)`,
        }}
      >
        <div className="text-label">
          {arrow.option.title}
        </div>
        {arrow.option.src ? 
          <img className="image-label" src={arrow.option.src}/>
          :
          <div className="shortened-label">
            {arrow.option.shortTitle}
          </div>
        }
      </div>
    </button>
  );
})}

      {box && (
          <NodeView node={currentNode} box={box}/>
      )}

      {!isAtRoot && (
        <button
          type="button"
          className="portfolio-reset"
          onClick={handleReset}
        >
          Home
        </button>
      )}
    </div>
  );
}
