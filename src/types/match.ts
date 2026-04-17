interface Match {
    id: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
    rounds: Round[];
}

interface Round {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    minigame: Minigame;
}

interface Minigame {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}