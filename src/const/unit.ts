import { UnitInfo, UnitName } from '../types/unit';

/** Resources */
import javascript from '../assets/unit/javascript.png';
import typescript from '../assets/unit/typescript.png';
import html from '../assets/unit/html.png';
import css from '../assets/unit/css.png';

export const UNIT_CNT_LIMIT = 100;

export const UNIT_GENERATION_COST = 10;

const units: Record<UnitName, UnitInfo & { imgSrc: string }> = {
  javascript: {
    name: 'javascript',
    desc: 'Javascript',
    grade: 1,
    attackType: 'basic',
    damage: 1,
    speed: 1,
    reload: 1,
    nextUnits: [
      {
        unitName: 'typescript',
        neededUnits: ['javascript', 'javascript'],
      },
    ],
    returnCost: 5,
    imgSrc: javascript,
  },
  html: {
    name: 'html',
    desc: 'HTML',
    grade: 1,
    attackType: 'basic',
    damage: 1,
    speed: 1,
    reload: 1,
    nextUnits: [],
    returnCost: 5,
    imgSrc: html,
  },
  css: {
    name: 'css',
    desc: 'CSS',
    grade: 1,
    attackType: 'basic',
    damage: 1,
    speed: 1,
    reload: 1,
    nextUnits: [],
    returnCost: 5,
    imgSrc: css,
  },
  typescript: {
    name: 'typescript',
    desc: 'typescript',
    grade: 2,
    attackType: 'basic',
    damage: 1,
    speed: 2,
    reload: 1,
    nextUnits: [],
    returnCost: 5,
    imgSrc: typescript,
  },
};

export default units;
