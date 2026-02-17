"""Utilitários FSRS (Spaced Repetition)"""

from datetime import datetime, timedelta


def calculate_fsrs(fsrs_state, rating):
    """
    Calcular novo estado FSRS baseado na resposta do usuário.

    Args:
        fsrs_state: Estado FSRS atual (pode ter valores padrão)
        rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)

    Returns:
        Dict com novo estado
    """

    # Fatores FSRS (simplificado)
    INITIAL_DIFFICULTY = 5
    INITIAL_STABILITY = 1
    DIFFICULTY_MULT = [1.3, 1, 0.6, 0.4]  # Como dificuldade muda
    STABILITY_MULT = [0.15, 0.6, 2.4, 4]  # Como estabilidade cresce

    # Estados atuais
    difficulty = fsrs_state.difficulty or INITIAL_DIFFICULTY
    stability = fsrs_state.stability or INITIAL_STABILITY
    reps = fsrs_state.reps or 0
    lapses = fsrs_state.lapses or 0
    state = fsrs_state.state or "new"

    # Atualizar dificuldade
    difficulty = max(1, min(10, difficulty + (5 - rating) * 0.1))

    # Lógica por estado
    if rating == 1:  # Again
        lapses += 1
        reps = 0
        state = "learning"
        scheduled_days = 1
        new_stability = stability * 0.36

    elif rating == 2:  # Hard
        reps += 1
        state = "learning"
        scheduled_days = 1
        new_stability = stability * 0.54

    elif rating == 3:  # Good
        reps += 1
        if state == "new":
            state = "learning"
            scheduled_days = 3
        elif state == "learning":
            state = "review"
            scheduled_days = max(1, int(stability * 9.2))
        else:  # review
            scheduled_days = max(1, int(stability * 9.2))
        new_stability = stability * 2.18

    elif rating == 4:  # Easy
        reps += 1
        if state == "new":
            state = "review"
            scheduled_days = 4
        else:
            scheduled_days = max(1, int(stability * 9.2 * 1.3))
        new_stability = stability * 2.36
        state = "review"

    else:
        scheduled_days = 1
        new_stability = stability

    stability = new_stability

    # Calcular próxima revisão
    next_review = datetime.utcnow() + timedelta(days=scheduled_days)

    return {
        "stability": stability,
        "difficulty": difficulty,
        "elapsed_days": 0,
        "scheduled_days": scheduled_days,
        "reps": reps,
        "lapses": lapses,
        "state": state,
        "next_review": next_review,
    }
