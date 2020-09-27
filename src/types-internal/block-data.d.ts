import {BlockToolData} from '../../types/tools';

/**
 * Tool's saved data
 */
export interface SavedData {
    id: string;
    disabled: boolean;
    tool: string;
    data: BlockToolData;
    time: number;
}

/**
 * Tool's data after validation
 */
export interface ValidatedData {
    id?: string;
    disabled?: boolean;
    tool?: string;
    data?: BlockToolData;
    time?: number;
    isValid: boolean;
}
