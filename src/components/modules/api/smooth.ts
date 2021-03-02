/* eslint-disable arrow-spacing */
import Module from '../../__module';
import { Smooth } from '../../../../types/api';
import SelectionUtils from '../../selection';
import Block, { BlockToolAPI } from '../../block';
import $ from '../../dom';
import * as _ from './../../utils';
import { BlockToolData, ToolConfig } from '../../../../types';

/**
 * @class BlocksAPI
 * provides with methods working with Block
 */
export default class SmoothAPI extends Module {
  /**
   * Available methods
   *
   */
  public get methods(): Smooth {
    return {
      backspace: (e: KeyboardEvent, force: boolean): void => this.backspace(e, force),
      mergeBlock: (): void => this.mergeBlocks(),
      splitBlock: (data: { text: string }): Block => this.splitBlock(data),
      enter: (e: KeyboardEvent, data: object): void => this.enter(e, data),
      replaceBlockByIndex: (type: string, data: BlockToolData, _index: number, id?: string, needToFocus?: boolean): void => this.replaceBlockByIndex(type, data, _index, id, needToFocus),
      replaceBlockByID: (type: string, data: BlockToolData, id: string, needToFocus?: boolean): void => this.replaceBlockByID(type, data, id, needToFocus),
      getBlockIndexByID: (id: string): number => this.getBlockIndexByID(id),
    };
  }

  /**
   * Handle backspace keydown on Block
   *
   * @param {KeyboardEvent} event - keydown
   * @param {boolean} force - keydown
   */
  public backspace(event: KeyboardEvent, force = false): void {
    const { BlockManager, BlockSelection, Caret } = this.Editor;
    const currentBlock = BlockManager.currentBlock;
    const tool = this.Editor.Tools.available[currentBlock.name];

    /**
     * Check if Block should be removed by current Backspace keydown
     */
    if (currentBlock.selected || (currentBlock.isEmpty && currentBlock.currentInput === currentBlock.firstInput)) {
      event.preventDefault();

      const index = BlockManager.currentBlockIndex;

      if (BlockManager.previousBlock && BlockManager.previousBlock.inputs.length === 0) {
        /** If previous block doesn't contain inputs, remove it */
        BlockManager.removeBlock(index - 1);
      } else {
        /** If block is empty, just remove it */
        BlockManager.removeBlock();
      }

      Caret.setToBlock(
        BlockManager.currentBlock,
        index ? Caret.positions.END : Caret.positions.START
      );

      /** Close Toolbar */
      this.Editor.Toolbar.close();

      /** Clear selection */
      BlockSelection.clearSelection(event);

      return;
    }

    /**
     * Don't handle Backspaces when Tool sets enableLineBreaks to true.
     * Uses for Tools like <code> where line breaks should be handled by default behaviour.
     *
     * But if caret is at start of the block, we allow to remove it by backspaces
     */
    if (tool && tool[this.Editor.Tools.INTERNAL_SETTINGS.IS_ENABLED_LINE_BREAKS] && !Caret.isAtStart) {
      return;
    }

    const isFirstBlock = BlockManager.currentBlockIndex === 0;

    const canMergeBlocks = Caret.isAtStart &&
      SelectionUtils.isCollapsed &&
      currentBlock.currentInput === currentBlock.firstInput &&
      !isFirstBlock;

    console.log('this,Caret.isAtStart', Caret.isAtStart);

    if (canMergeBlocks || force) {
      /**
       * preventing browser default behaviour
       */
      event.preventDefault();

      /**
       * Merge Blocks
       */
      this.mergeBlocks();
    }
  }

  /**
   * Merge current and previous Blocks if they have the same type
   */
  public mergeBlocks(): void {
    const { BlockManager, Caret, Toolbar } = this.Editor;
    const targetBlock = BlockManager.previousBlock;
    const blockToMerge = BlockManager.currentBlock;

    /**
     * Blocks that can be merged:
     * 1) with the same Name
     * 2) Tool has 'merge' method
     *
     * other case will handle as usual ARROW LEFT behaviour
     */
    if (blockToMerge.name !== targetBlock.name || !targetBlock.mergeable) {
      /** If target Block doesn't contain inputs or empty, remove it */
      if (targetBlock.inputs.length === 0 || targetBlock.isEmpty) {
        BlockManager.removeBlock(BlockManager.currentBlockIndex - 1);

        Caret.setToBlock(BlockManager.currentBlock);
        Toolbar.close();

        return;
      }

      if (Caret.navigatePrevious()) {
        Toolbar.close();
      }

      return;
    }

    Caret.createShadow(targetBlock.pluginsContent);
    BlockManager.mergeBlocks(targetBlock, blockToMerge)
      .then(() => {
        /** Restore caret position after merge */
        Caret.restoreCaret(targetBlock.pluginsContent as HTMLElement);
        targetBlock.pluginsContent.normalize();
        Toolbar.close();
      });
  }

  /**
   * ENTER pressed on block
   *
   * @param {KeyboardEvent} event - keydown
   * @param {object} data - initial block data
   */
  public enter(event: KeyboardEvent, data): void {
    const { BlockManager, Tools, UI } = this.Editor;
    const currentBlock = BlockManager.currentBlock;
    const tool = Tools.available[currentBlock.name];

    /**
     * Don't handle Enter keydowns when Tool sets enableLineBreaks to true.
     * Uses for Tools like <code> where line breaks should be handled by default behaviour.
     */
    if (tool && tool[Tools.INTERNAL_SETTINGS.IS_ENABLED_LINE_BREAKS]) {
      return;
    }

    /**
     * Opened Toolbars uses Flipper with own Enter handling
     * Allow split block when no one button in Flipper is focused
     */
    if (UI.someToolbarOpened && UI.someFlipperButtonFocused) {
      return;
    }

    /**
     * Allow to create linebreaks by Shift+Enter
     */
    if (event.shiftKey) {
      return;
    }

    let newCurrent = this.Editor.BlockManager.currentBlock;

    /**
     * If enter has been pressed at the start of the text, just insert paragraph Block above
     */
    if (this.Editor.Caret.isAtStart && !this.Editor.BlockManager.currentBlock.hasMedia) {
      this.Editor.BlockManager.insertDefaultBlockAtIndex(this.Editor.BlockManager.currentBlockIndex);
    } else {
      /**
       * Split the Current Block into two blocks
       * Renew local current node after split
       */
      //   newCurrent = this.Editor.BlockManager.split();
      newCurrent = this.splitBlock(data);
    }

    this.Editor.Caret.setToBlock(newCurrent);

    /**
     * If new Block is empty
     */
    if (this.Editor.Tools.isDefault(newCurrent.tool) && newCurrent.isEmpty) {
      /**
       * Show Toolbar
       */
      this.Editor.Toolbar.open(false);

      /**
       * Show Plus Button
       */
      this.Editor.Toolbar.plusButton.show();
    }

    event.preventDefault();
  }

  /**
   * split current and split Blocks if they have the same type
   *
   * @param data
   */
  public splitBlock(data: { text: string }): Block {
    const extractedFragment = this.Editor.Caret.extractFragmentFromCaretPosition();

    console.log('split block', extractedFragment);

    const wrapper = $.make('div');

    wrapper.appendChild(extractedFragment as DocumentFragment);

    /**
     * @todo make object in accordance with Tool
     */
    // console.log('split block', data);

    data.text = $.isEmpty(wrapper) ? '' : wrapper.innerHTML;

    /**
     * Renew current Block
     *
     * @type {Block}
     */
    return this.Editor.BlockManager.insert({ data });
  }

  /**
   * replace  Blocks data
   *
   * @param {string} type — Tool name
   * @param {BlockToolData} data — Tool data to insert
   * @param {ToolConfig} config — Tool config
   * @param {number?} index — index where to insert new Block
   * @param {boolean?} needToFocus - flag to focus inserted Block
   * @param {boolean?}id
   */
  public replaceBlockByIndex(
    type: string,
    data: BlockToolData,
    index: number,
    id?: string,
    needToFocus?: boolean,
  ): void {
    if (!id) {
      id = _.generateUuidv4();
    }
    const replace = true;

    this.Editor.BlockManager.insert({
      id,
      tool: type,
      data,
      index,
      needToFocus,
      replace,
    });
  }

  /**
   * place  Blocks data
   *
   * @param {string} type — Tool name
   * @param {BlockToolData} data — Tool data to insert
   * @param {string?} id — id where to replace Block
   * @param {boolean?} needToFocus - flag to focus inserted Block
   */
  public replaceBlockByID(
    type: string,
    data: BlockToolData,
    id: string,
    needToFocus?: boolean,
  ): void {
    const blockIndex = this.getBlockIndexByID(id);

    this.replaceBlockByIndex(type, data, blockIndex, id, needToFocus);
  }

  /**
   * get Block index
   * @param {string} type — Tool name
   * @param {BlockToolData} data — Tool data to insert
   * @param {string?} id — id where to replace Block
   * @param {boolean?} needToFocus - flag to focus inserted Block
   */
  public getBlockIndexByID(id: string): number {
    const blocks = this.Editor.BlockManager.blocks;
    let blockIndex;

    blocks.forEach((block, index) => {
      if (block.id === id) {
        blockIndex = index;
      }
    });

    if (typeof blockIndex === 'number') {
      return blockIndex;
    } else {
      throw new Error('findBlockByID');
    }
  }
}
