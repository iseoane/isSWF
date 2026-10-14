"""Operator CLI for U1."""
import argparse
import json
import sys

from .intake import IntakeError, authorize, prepare, show
from .panel import serve


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m isswf")
    parser.add_argument("--state", required=True, help="directorio privado de estado")
    commands = parser.add_subparsers(dest="command", required=True)
    auth = commands.add_parser("authorize")
    auth.add_argument("file")
    prep = commands.add_parser("prepare")
    prep.add_argument("file")
    display = commands.add_parser("show")
    display.add_argument("id", nargs="?")
    panel = commands.add_parser("serve")
    panel.add_argument("--port", type=int, default=8765)
    args = parser.parse_args(argv)
    try:
        if args.command == "authorize":
            result = authorize(args.state, args.file)
        elif args.command == "prepare":
            result = prepare(args.state, args.file)
        elif args.command == "show":
            result = show(args.state, args.id)
        else:
            if not 0 <= args.port <= 65535:
                raise IntakeError("port debe estar entre 0 y 65535")
            serve(args.state, args.port)
            return 0
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except IntakeError as exc:
        print(f"isswf: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
