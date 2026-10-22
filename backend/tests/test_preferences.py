import pytest
from app.services.preference_service import PreferenceService


def test_session_isolation():
    service = PreferenceService()
    session_a = service.get_or_create_session(session_id="session-user-1", initial_city="hyderabad")
    session_b = service.get_or_create_session(session_id="session-user-2", initial_city="tokyo")

    assert session_a.city == "hyderabad"
    assert session_b.city == "tokyo"
    assert session_a.currency == "INR"
    assert session_b.currency == "JPY"

    service.update_preferences("session-user-1", direct_updates={"companion_type": "couples"})
    state_a = service.get_or_create_session("session-user-1")
    state_b = service.get_or_create_session("session-user-2")

    assert state_a.companion_type == "couples"
    assert state_b.companion_type is None  # Session B remains clean!


def test_partial_preference_preservation():
    service = PreferenceService()
    # Step 1: Initial query
    state = service.update_preferences("test-seq", user_message="Find places in Kyoto")
    assert state.city == "kyoto"
    assert state.currency == "JPY"

    # Step 2: Add companion
    state = service.update_preferences("test-seq", user_message="I'm looking for somewhere to go with my girlfriend")
    assert state.city == "kyoto"
    assert state.companion_type == "couples"

    # Step 3: Add atmosphere
    state = service.update_preferences("test-seq", user_message="Somewhere peaceful and not too crowded")
    assert state.city == "kyoto"
    assert state.companion_type == "couples"
    assert "peaceful" in state.atmosphere

    # Step 4: Add budget and time
    state = service.update_preferences("test-seq", user_message="Keep it under ¥5,000 and preferably in the evening")
    assert state.city == "kyoto"
    assert state.companion_type == "couples"
    assert "peaceful" in state.atmosphere
    assert state.budget_max == 5000.0
    assert state.preferred_time == "evening"

    # Step 5: Switch city to Tokyo
    state = service.update_preferences("test-seq", user_message="Actually, make it Tokyo")
    assert state.city == "tokyo"  # City updated
    assert state.companion_type == "couples"  # Compatible constraints preserved!
    assert "peaceful" in state.atmosphere
    assert state.budget_max == 5000.0


def test_remove_field_and_reset():
    service = PreferenceService()
    service.update_preferences("test-reset", direct_updates={"companion_type": "family", "budget_max": 1000.0})
    state = service.remove_field("test-reset", "companion_type")
    assert state.companion_type is None
    assert state.budget_max == 1000.0

    reset_state = service.reset_session("test-reset")
    assert reset_state.budget_max is None
    assert reset_state.companion_type is None
