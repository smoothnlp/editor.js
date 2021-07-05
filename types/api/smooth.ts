import Block from '../../src/components/block';
import { BlockToolData } from '../tools';

/**
 * Describes Editor`s I18n API
 */
export interface Smooth {

    mergeBlocks(): void;
    splitBlock(data: object): Block;
    backspace(event: KeyboardEvent, force: boolean): void;
    enter(event: KeyboardEvent, data: object): void;
    replaceBlockByIndex(type: string, data: BlockToolData, index: number, id?: string, needToFocus?: boolean): void;
    replaceBlockByID(type: string, data: BlockToolData, id: string, needToFocus?: boolean): void;
    getBlockIndexByID(id: string): number;
    removeBlockByID(id: string): void;
    moveBlockToIndexByID(id: string, _toIndex: number, newData: BlockToolData): void ;
}
