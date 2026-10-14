"""Pluggable analysis-provider interface.

Stage 1 uses deterministic local rules only. Future approved AI adapters should implement
analyze(document_type, text) and return findings with source provenance. No network/API calls
are made by this module.
"""
from abc import ABC, abstractmethod
from services.reference_service import evaluate_against_rules


class AnalysisProvider(ABC):
    @abstractmethod
    def analyze(self, document_type: str, text: str) -> list[dict]:
        """Return explainable findings; each finding should retain its source/rule IDs."""
        raise NotImplementedError


class LocalRuleProvider(AnalysisProvider):
    def analyze(self, document_type: str, text: str) -> list[dict]:
        return evaluate_against_rules(document_type, text)


def get_analysis_provider() -> AnalysisProvider:
    """Provider factory. Default is local-only; future adapters can be selected here."""
    return LocalRuleProvider()
