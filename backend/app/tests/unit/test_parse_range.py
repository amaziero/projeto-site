import pytest
from app.services.pdf_service import parse_page_range
from app.core.exceptions import PageRangeError

def test_parse_ok():
    assert parse_page_range("3-7") == (3, 7)
    assert parse_page_range(" 1-1 ") == (1, 1)

def test_parse_bad_format():
    with pytest.raises(PageRangeError):
        parse_page_range("a-b")

    with pytest.raises(PageRangeError):
        parse_page_range("3-")

def test_pare_inverted():
    with pytest.raises(PageRangeError):
        parse_page_range("7-3")

def test_parse_zero():
    with pytest.raises(PageRangeError):
        parse_page_range("0-5")