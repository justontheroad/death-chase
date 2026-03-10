export interface CharacterParams {
    name: string;
    attackRange: number;
    speed: number;
    abilities: string[];
}

export enum CharacterState {
    PREY = 'prey',
    HUNTER = 'hunter'
}