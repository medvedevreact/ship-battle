import { useEffect, useState } from "react";
import { isEqual } from "lodash";
import "./App.scss";

const GRID_SIZE = 10;
const SHIP_LENGTHS = [4, 3, 2, 1];

const initialGrid: string[][] = Array.from({ length: GRID_SIZE }, () =>
  Array(GRID_SIZE).fill("0")
);

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

const isAdjacentToShip = (
  isHorizontal: boolean,
  x: number,
  y: number,
  shipLength: number,
  grid: string[][]
): boolean => {
  let flag = true;
  if (isHorizontal) {
    for (let i = 0; i < shipLength; i++) {
      if (grid[x + i][y] === "S") {
        flag = false;
        break;
      }

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const newX = x + i + dx;
          const newY = y + dy;
          if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            if (grid[newX][newY] === "S") {
              flag = false;
              break;
            }
          }
        }
      }
    }
  } else {
    for (let i = 0; i < shipLength; i++) {
      if (grid[x][y + i] === "S") {
        flag = false;
        break;
      }

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const newX = x + dx;
          const newY = y + i + dy;
          if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            if (grid[newX][newY] === "S") {
              flag = false;
              break;
            }
          }
        }
      }
    }
  }
  return flag;
};

const placeShipsRandomly = (): string[][] => {
  const randomFilledGrid = initialGrid.map((row) => [...row]);
  SHIP_LENGTHS.forEach((shipLength) => {
    let placed = false;
    while (!placed) {
      const x = getRandomInt(1, GRID_SIZE);
      const y = getRandomInt(1, GRID_SIZE);
      const isHorizontal = Math.random() < 0.5;

      if (
        (isHorizontal &&
          x + shipLength <= GRID_SIZE &&
          randomFilledGrid[x][y] !== "S" &&
          isAdjacentToShip(isHorizontal, x, y, shipLength, randomFilledGrid)) ||
        (!isHorizontal &&
          y + shipLength <= GRID_SIZE &&
          randomFilledGrid[x][y] !== "S" &&
          isAdjacentToShip(isHorizontal, x, y, shipLength, randomFilledGrid))
      ) {
        for (let i = 0; i < shipLength; i++) {
          const posX = isHorizontal ? x + i : x;
          const posY = isHorizontal ? y : y + i;
          randomFilledGrid[posX][posY] = "S";
        }
        placed = true;
      }
    }
  });
  return randomFilledGrid;
};

// @ts-ignore
function print2DArray(array: string[][]): void {
  array.forEach((row: string[]) => {
    console.log(row.join(" "));
  });
}

function App() {
  const [playerGrid, setPlayerGrid] = useState<string[][]>(initialGrid);
  const [botGrid, setBotGrid] = useState<string[][]>(initialGrid);
  const [isBotShipsVisible, setIsBotShipsVisible] = useState<boolean>(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isPlayerWon, setIsPlayerWon] = useState(false);
  const [isBotWon, setIsBotWon] = useState(false);
  const [playerShots, setPlayerShots] = useState<[number, number][]>([]);
  const [botShots, setBotShots] = useState<[number, number][]>([]);

  const restartGame = () => {
    setPlayerGrid(placeShipsRandomly());
    setBotGrid(placeShipsRandomly());
    setIsBotWon(false);
    setIsPlayerWon(false);
    setIsPlayerTurn(true);
    setIsBotShipsVisible(false);
    setPlayerShots([]);
    setBotShots([]);
  };

  const isShipDead = (
    grid: string[][],
    rowIndex: number,
    cellIndex: number
  ): [number, number][] | null => {
    const isHorizontal =
      (cellIndex + 1 < GRID_SIZE &&
        (grid[rowIndex][cellIndex + 1] === "S" ||
          grid[rowIndex][cellIndex + 1] === "H")) ||
      (cellIndex - 1 >= 0 &&
        (grid[rowIndex][cellIndex - 1] === "S" ||
          grid[rowIndex][cellIndex - 1] === "H"));

    const shipCells: [number, number][] = [[rowIndex, cellIndex]];

    if (isHorizontal) {
      let startCol = cellIndex - 1;
      while (
        startCol >= 0 &&
        (grid[rowIndex][startCol] === "S" || grid[rowIndex][startCol] === "H")
      ) {
        shipCells.push([rowIndex, startCol]);
        startCol--;
      }
      startCol = cellIndex + 1;
      while (
        startCol < GRID_SIZE &&
        (grid[rowIndex][startCol] === "S" || grid[rowIndex][startCol] === "H")
      ) {
        shipCells.push([rowIndex, startCol]);
        startCol++;
      }
    } else {
      let startLine = rowIndex - 1;
      while (
        startLine >= 0 &&
        (grid[startLine][cellIndex] === "S" ||
          grid[startLine][cellIndex] === "H")
      ) {
        shipCells.push([startLine, cellIndex]);
        startLine--;
      }
      startLine = rowIndex + 1;
      while (
        startLine < GRID_SIZE &&
        (grid[startLine][cellIndex] === "S" ||
          grid[startLine][cellIndex] === "H")
      ) {
        shipCells.push([startLine, cellIndex]);
        startLine++;
      }
    }
    const isDead = shipCells.every(([r, c]) => grid[r][c] === "H");

    return isDead ? shipCells : null;
  };

  const handleShot = (
    grid: string[][],
    setGrid: React.Dispatch<React.SetStateAction<string[][]>>,
    rowIndex: number,
    cellIndex: number
  ) => {
    const updatedGrid = grid.map((row, rIndex) =>
      row.map((cell, cIndex) => {
        if (rIndex === rowIndex && cIndex === cellIndex && cell === "S") {
          return "H";
        } else if (
          rIndex === rowIndex &&
          cIndex === cellIndex &&
          cell === "0"
        ) {
          return "M";
        }

        return cell;
      })
    );

    const shipCells = isShipDead(updatedGrid, rowIndex, cellIndex);

    if (shipCells) {
      shipCells.forEach(([c, r]) => {
        updatedGrid[c][r] = "D";
      });
    }

    setGrid(updatedGrid);
  };

  const playerShot = (rowIndex: number, cellIndex: number) => {
    const shotExists = playerShots.some(
      (shot) => shot[0] === rowIndex && shot[1] === cellIndex
    );
    if (isPlayerTurn && !shotExists) {
      handleShot(botGrid, setBotGrid, rowIndex, cellIndex);
      setIsPlayerTurn(false);
      setPlayerShots([...playerShots, [rowIndex, cellIndex]]);
    }
  };

  const botShot = () => {
    const rowIndex = getRandomInt(0, GRID_SIZE);
    const cellIndex = getRandomInt(0, GRID_SIZE);

    const shotExists = botShots.some(
      (shot) => shot[0] === rowIndex && shot[1] === cellIndex
    );

    if (!shotExists) {
      handleShot(playerGrid, setPlayerGrid, rowIndex, cellIndex);
      setIsPlayerTurn(true);
      setBotShots([...botShots, [rowIndex, cellIndex]]);
    } else {
      botShot();
    }
  };

  useEffect(() => {
    restartGame();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPlayerTurn) {
      timer = setTimeout(() => {
        botShot();
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isPlayerTurn]);

  useEffect(() => {
    let playerShips = 0;
    let botShips = 0;

    playerGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell === "S") {
          playerShips++;
        }
      });
    });

    botGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell === "S") {
          botShips++;
        }
      });
    });

    console.log(botShips, isPlayerWon);

    if (!isEqual(playerGrid, initialGrid) && !isEqual(botGrid, initialGrid)) {
      if (playerShips === 0) {
        setIsBotWon(true);
      } else if (botShips === 0) {
        setIsPlayerWon(true);
      }
    }
  }, [handleShot]);

  return (
    <div className="app">
      <h2 className="title">Морской бой</h2>
      <div className="game-board">
        <div className="board player-board">
          <h2 className="board__title">Ваше поле</h2>
          <div className="board__grid board__grid--player">
            {playerGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={`board__cell board__cell--player ${
                      cell === "S" ? "board__cell--ship" : ""
                    } ${cell === "H" ? "board__cell--hit" : ""}
                    ${cell === "M" ? "board__cell--miss" : ""}
                    ${cell === "D" ? "board__cell--dead" : ""}`}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="controls">
          <button className="controls__button" onClick={restartGame}>
            Перезапуск
          </button>

          <button
            className="controls__button"
            onClick={() => setIsBotShipsVisible(!isBotShipsVisible)}
          >
            {isBotShipsVisible
              ? "Скрыть корабли бота"
              : "Показать корабли бота"}
          </button>
        </div>

        <div className="board bot-board">
          <h2 className="board__title">Поле бота</h2>
          <div className="board__grid board__grid--bot">
            {botGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={`board__cell board__cell--bot
                      ${
                        isBotShipsVisible && cell === "S"
                          ? "board__cell--ship"
                          : ""
                      }
                      ${cell === "H" ? "board__cell--hit" : ""}
                      ${cell === "M" ? "board__cell--miss" : ""}
                      ${cell === "D" ? "board__cell--dead" : ""}`}
                    onClick={() => playerShot(rowIndex, cellIndex)}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {(isPlayerWon || isBotWon) && (
        <>
          <div className="modal-overlay"></div>
          <div className="modal">
            {isPlayerWon ? (
              <>
                <h2 className="modal__title">Вы победили</h2>
                <button className="controls__button" onClick={restartGame}>
                  Перезапуск
                </button>
              </>
            ) : (
              <>
                <h2 className="modal__title">
                  Вы проиграли. Попробуйте еще раз!
                </h2>
                <button className="controls__button" onClick={restartGame}>
                  Перезапуск
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
