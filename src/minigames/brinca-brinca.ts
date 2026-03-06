const exercises : Exercise[]  = [
    {
        "operation": "F(x) = 5x + x + 3",
        "options": [
            {"result": "5 + 1", "is_correct": true},
            {"result": "5x", "is_correct": false},
            {"result": "3", "is_correct": false},
            {"result": "6x + 3", "is_correct": false}
        ] 
    },
    {
        "operation": "F(x) = 15x + 2",
        "options": [
            {"result": "15", "is_correct": true},
            {"result": "15x", "is_correct": false},
            {"result": "2", "is_correct": false},
            {"result": "17x", "is_correct": false}
        ] 
    },
    {
        "operation": "F(x) = 4x^3 + 2x^2 + 2",
        "options": [
            {"result": "12x^2 + 4x", "is_correct": true},
            {"result": "64x + 4x", "is_correct": false},
            {"result": "6x^5 + 2", "is_correct": false},
            {"result": "2", "is_correct": false}
        ] 
    },
    {
        "operation": "F(x) = 7x^2 + 10",
        "options": [
            {"result": "14x", "is_correct": true},
            {"result": "17x^2", "is_correct": false},
            {"result": "27x", "is_correct": false},
            {"result": "10x", "is_correct": false}
        ] 
    }
];

function getBrincaBrincaExercises(): Exercise[] {
    return exercises;
}