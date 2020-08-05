import Block from '../../src/components/block';

/**
 * Describes Editor`s I18n API
 */
export interface Smooth {

    mergeBlock(): void;
    splitBlock(data: object): Block;
    backspace(event: KeyboardEvent, force: boolean): void;
    enter(event: KeyboardEvent, data: object): void;
}
