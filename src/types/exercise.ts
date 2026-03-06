interface Exercise {
    operation: string;
    options: Option[];
}

interface Option {
    result: string
    is_correct: boolean;
}