interface Exercise {
    id: number;
    description?: string;
    operation: string;
    options: Option[];
}

interface Option {
    id: number;
    result: string
    is_correct: boolean;
}