const exercises : Exercise[]  = [
    {
        "id": 1,
        "operation": "F(x) = 5x + x + 3",
        "options": [
            {
                "id": 1,
                "result": "5 + 1", 
                "is_correct": true
            },
            {"id": 2, "result": "5x", "is_correct": false},
            {"id": 3, "result": "3", "is_correct": false},
            {"id": 4, "result": "6x + 3", "is_correct": false}
        ] 
    },
    {
        "id": 2,
        "operation": "F(x) = 15x + 2",
        "options": [
            {"id": 5, "result": "15x", "is_correct": false},
            {"id": 6, "result": "2", "is_correct": false},
            {"id": 7, "result": "15", "is_correct": true},
            {"id": 8, "result": "17x", "is_correct": false}
        ] 
    },
    {
        "id": 3,
        "operation": "F(x) = 4x^3 + 2x^2 + 2",
        "options": [
            {"id": 9, "result": "64x + 4x", "is_correct": false},
            {"id": 10, "result": "12x^2 + 4x", "is_correct": true},
            {"id": 11, "result": "6x^5 + 2", "is_correct": false},
            {"id": 12, "result": "2", "is_correct": false}
        ] 
    },
    {
        "id": 4,
        "operation": "F(x) = 7x^2 + 10",
        "options": [
            {
                "id": 13,
                "result": "17x^2", 
                "is_correct": false
            },
            {"id": 14, "result": "27x", "is_correct": false},
            {"id": 15, "result": "10x", "is_correct": false},
            {"id": 16, "result": "14x", "is_correct": true},
        ] 
    }
];

function getBrincaBrincaExercises(nk: nkruntime.Nakama, logger: nkruntime.Logger): Exercise[] {
    try {
        const response = nk.httpRequest(
            GET_EXERCISES_URL.replace(":rounds", Brinca.NUMBER_OF_ROUNDS.toString()),
            "get",
        );

        if (response.code < 200 || response.code >= 300) {
            logger.error("Failed to fetch exercises:", response);
            return exercises;
        } else {
            const exercises : Exercise[] = JSON.parse(response.body).map((exercise: any) => {
                const options = exercise.steps[0].options.map((option: any) => ({
                    id: option.id,
                    result: option.result,
                    is_correct: option.isCorrect
                }));

                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tmp = options[i];
                    options[i] = options[j];
                    options[j] = tmp;
                }

                return {
                    id: exercise.id,
                    operation: exercise.operation,
                    description: exercise.description,
                    options
                };
            });
            return exercises;
        }
    } catch (error) {
        logger.error("Error occurred while fetching exercises:", error);
        return exercises;
    }
}

function saveRanking(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: number, score: number, accuracy: number, position: number, roundId: number): void {
    try {
        const response = nk.httpRequest(
            SAVE_RANKING_URL,
            "post",
            {
                "Content-Type": "application/json"
            },
            JSON.stringify({
                userId: userId,
                score: score,
                accuracy: accuracy,
                position: position,
                roundId: roundId
            })
        );

        if (response.code < 200 || response.code >= 300) {
            logger.error("Failed to save ranking:", response);
        }
    } catch (error) {
        logger.error("Error occurred while saving ranking:", error);
    }
}

function saveAttemp(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: number, isCorrect: boolean, exerciseId: number, optionId: number): void {
    try {
        const response = nk.httpRequest(
            SAVE_ATTEMP_URL,
            "post",
            {
                "Content-Type": "application/json"
            },
            JSON.stringify({
                userId: userId,
                isCorrect: isCorrect,
                exerciseId: exerciseId,
                optionId: optionId
            })
        )

        if (response.code < 200 || response.code >= 300) {
            logger.error("Failed to save attempt :", response);
        }
    } catch (error) {
        logger.error("Error occurred while saving attempt:", error);
    }
}