import { DrawShape, SquareHighlight } from 'shogiground/draw';
import { Piece } from 'shogiground/types';
import { opposite } from 'shogiground/util';
import { attacks, makeSquare, parseSquare, SquareSet } from 'shogiops';
import { UsiWithColor, Level, VmEvaluation, Shape } from './interfaces';
import { findCaptures, inCheck } from './shogi';
import { currentPosition } from './util';

export function arrow(orig: Key | Piece, dest: Key | Piece, brush?: string): DrawShape {
  return {
    orig,
    dest,
    brush: brush || 'paleGreen',
  };
}

export function circle(key: Key | Piece, brush?: string): DrawShape {
  return {
    orig: key,
    dest: key,
    brush: brush || 'paleGreen',
  };
}

export function custom(key: Key, svg: string): DrawShape {
  return {
    orig: key,
    dest: key,
    customSvg: svg,
    brush: '',
  };
}

export function concat<T extends Shape>(...advices: VmEvaluation<T[]>[]): VmEvaluation<T[]> {
  return (level: Level, usiCList: UsiWithColor[]): T[] =>
    advices.reduce((acc, cur) => acc.concat(cur(level, usiCList) || []), [] as T[]);
}

export function onPly<T extends Shape>(ply: number, shapes: T[]): VmEvaluation<T[]> {
  return (_level: Level, usiCList: UsiWithColor[]): T[] => {
    if (ply === usiCList.length) return shapes;
    else return [];
  };
}

export function initial<T extends Shape>(shapes: T[]): VmEvaluation<T[]> {
  return onPly<T>(0, shapes);
}

export function onDest<T extends Shape>(dest: Key, shapes: T[]): VmEvaluation<T[]> {
  return (_level: Level, usiCList: UsiWithColor[]): T[] => {
    if (usiCList.length && dest === usiCList[usiCList.length - 1].usi.slice(2, 4)) return shapes;
    else return [];
  };
}

export function onSuccess<T extends Shape>(shapes: T[]): VmEvaluation<T[]> {
  return (level: Level, usiCList: UsiWithColor[]): T[] => {
    if (level.success(level, usiCList)) return shapes;
    else return [];
  };
}

export function onFailure<T extends Shape>(shapes: T[]): VmEvaluation<T[]> {
  return (level: Level, usiCList: UsiWithColor[]): T[] => {
    if (usiCList.length && level.failure && level.failure(level, usiCList)) return shapes;
    else return [];
  };
}

export function checkShapes(level: Level, usiCList: UsiWithColor[]): DrawShape[] {
  if (!usiCList.length || !level.failure || !level.failure(level, usiCList)) return [];
  const pos = currentPosition(level, usiCList);
  const sideInCheck = inCheck(pos);
  if (sideInCheck) {
    const kingSq = pos.board.kingOf(sideInCheck)!;
    pos.turn = opposite(sideInCheck);
    const kingAttacks = findCaptures(pos);
    return kingAttacks
      .filter(m => m.to === kingSq)
      .map(m => arrow(makeSquare(m.from) as Key, makeSquare(m.to) as Key, 'red'));
  } else return [];
}

export function pieceMovesHighlihts(piece: Piece, key: Key): SquareHighlight[] {
  const keys: Key[] = [],
    squares = attacks(piece, parseSquare(key), SquareSet.empty());
  for (const s of squares) {
    keys.push(makeSquare(s) as Key);
  }
  return keys.map(k => {
    return { key: k, className: 'help' };
  });
}