import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useGlobalContext } from './GlobalContext';
import { upgradeCost } from '../const/calc';
import { UPGRADEABLE_STATUS } from '../types/game';
import { NextUnit, Unit } from '../types/unit';
import units, {
  UNIT_CNT_LIMIT,
  UNIT_GENERATION_COST,
  createNewUnit,
  getRandomFirstGradeUnit,
} from '../const/unit';
import { map } from '../const/map';

const INCRASE_MONEY_INTERVAL = 100;

interface GameStatus {
  level: number;
  life: number;
  money: number;
  moneyLevel: number;
  power: number;
  speed: number;
  reload: number;
}

interface GameContext extends GameStatus {
  unitList: Unit[];
  startIncreaseMoney: VoidFunction;
  upgradeStatus: (type: UPGRADEABLE_STATUS) => () => void;
  generateUnit: VoidFunction;
  selectedUnitId: string;
  setSelectedUnitId: Dispatch<SetStateAction<string>>;
  relocateSelectedUnit: (x: number, y: number) => void;
  sellSelectedUnit: VoidFunction;
  upgradeUnit: (nextUnit: NextUnit) => void;
}

const defaultGameStatusValue: GameStatus = {
  level: 1,
  life: 100,
  money: 1,
  moneyLevel: 1,
  power: 0,
  speed: 0,
  reload: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gameContext = createContext<GameContext>({} as any);

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(
    defaultGameStatusValue
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string>();
  const [unitList, setUnitList] = useState<Unit[]>([]);
  const { showGameMessage } = useGlobalContext();
  const timerIds = useRef<{
    money?: number;
  }>({});

  const startIncreaseMoney = useCallback(() => {
    if (timerIds.current.money) {
      clearInterval(timerIds.current.money);
    }

    timerIds.current.money = setInterval(() => {
      setGameStatus((prevGameStatus) => ({
        ...prevGameStatus,
        money: prevGameStatus.money + prevGameStatus.moneyLevel,
      }));
    }, INCRASE_MONEY_INTERVAL);
  }, []);

  const upgradeStatus = useCallback(
    (type: UPGRADEABLE_STATUS) => () => {
      const cost = upgradeCost(type, gameStatus[type]);

      if (gameStatus.money < cost) {
        showGameMessage('Not enough money');
        return;
      }

      setGameStatus((prevGameStatus) => ({
        ...prevGameStatus,
        money: prevGameStatus.money - cost,
        [type]: prevGameStatus[type] + 1,
      }));
    },
    [gameStatus, showGameMessage]
  );

  const relocateSelectedUnit = useCallback(
    (x: number, y: number) => {
      if (!selectedUnitId) return;

      const selectedUnit = unitList.find((unit) => unit.id === selectedUnitId);
      if (!selectedUnit) {
        return;
      }

      selectedUnit.x = x;
      selectedUnit.y = y;
      setSelectedUnitId(undefined);
    },
    [selectedUnitId, unitList]
  );

  const sellSelectedUnit = useCallback(() => {
    if (!selectedUnitId) return;

    const selectedUnit = unitList.find((unit) => unit.id === selectedUnitId);
    if (!selectedUnit) {
      return;
    }

    setUnitList((prevUnitList) =>
      prevUnitList.filter((unit) => unit.id !== selectedUnitId)
    );
    setGameStatus((prevGameStatus) => ({
      ...prevGameStatus,
      money: prevGameStatus.money + selectedUnit.returnCost,
    }));
    setSelectedUnitId(undefined);
  }, [selectedUnitId, unitList]);

  const upgradeUnit = useCallback(
    (nextUnit: NextUnit) => {
      const newUnit = createNewUnit({
        unit: units[nextUnit.unitName],
        map,
        unitList,
      });
      if (!newUnit) {
        console.error('next unit not found');
        return;
      }

      const neededUnits = [...nextUnit.neededUnits];
      const unitsWillUse = [];

      for (const unit of unitList) {
        const index = neededUnits.indexOf(unit.name);
        if (index !== -1) {
          unitsWillUse.push(unit.id);
          neededUnits.splice(index, 1);
        }

        if (neededUnits.length === 0) break;
      }

      if (neededUnits.length > 0) {
        showGameMessage('Need More Units');
        return;
      }

      const newUnitList = unitList
        .filter((unit) => !unitsWillUse.includes(unit.id))
        .concat(newUnit);

      setUnitList(newUnitList);
      setSelectedUnitId(undefined);
    },
    [showGameMessage, unitList]
  );

  const generateUnit = useCallback(() => {
    if (gameStatus.money < UNIT_GENERATION_COST) {
      showGameMessage('Not Enough Money');
      return;
    } else if (unitList.length > UNIT_CNT_LIMIT) {
      showGameMessage(`You cannot generate units more than ${UNIT_CNT_LIMIT}.`);
      return;
    }

    setGameStatus((prevGameStatus) => ({
      ...prevGameStatus,
      money: prevGameStatus.money - UNIT_GENERATION_COST,
    }));

    setUnitList((prevUnitList) => {
      const randomUnit = getRandomFirstGradeUnit();
      const newUnit = createNewUnit({
        unit: randomUnit,
        map,
        unitList: prevUnitList,
      });

      return newUnit ? prevUnitList.concat(newUnit) : prevUnitList;
    });
  }, [gameStatus.money, showGameMessage, unitList.length]);

  // Release timers
  useEffect(() => {
    return () => {
      if (timerIds.current.money) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        clearInterval(timerIds.current.money);
      }
    };
  }, []);

  const value = {
    ...gameStatus,
    unitList,
    startIncreaseMoney,
    upgradeStatus,
    generateUnit,
    selectedUnitId,
    setSelectedUnitId,
    relocateSelectedUnit,
    sellSelectedUnit,
    upgradeUnit,
  };

  return <gameContext.Provider value={value}>{children}</gameContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGameContext = () => useContext(gameContext);
