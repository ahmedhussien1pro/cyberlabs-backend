#!/usr/bin/env python3
"""
CyberLabs PCAP Generator
========================
Generates realistic .pcap files for Wireshark labs with dynamic per-user flags.

Requires: scapy
  pip install scapy

Usage (single lab):
  python tools/generate_pcap.py --lab 1 --user-id user123 --lab-id labABC
  python tools/generate_pcap.py --lab 2 --user-id user123 --lab-id labABC
  python tools/generate_pcap.py --lab 3 --user-id user123 --lab-id labABC

Usage (all labs at once → labs_assets/WireShark/):
  python tools/generate_pcap.py --all --user-id user123 --lab-id labABC

Output directory (default):
  labs_assets/WireShark/
    ├── lab1_http_creds.pcap
    ├── lab2_tcp_stream.pcap
    └── lab3_arp_spoof.pcap

Override output dir:
  python tools/generate_pcap.py --all --user-id u1 --lab-id l1 --output-dir /tmp/pcaps
"""

import argparse
import base64
import hashlib
import json
import os
from datetime import datetime

try:
    from scapy.all import (
        Ether, IP, TCP, ARP,
        Raw, wrpcap,
    )
except ImportError:
    raise SystemExit("[!] scapy not found. Run: pip install scapy")


# ─── Defaults ─────────────────────────────────────────────────────────────────

DEFAULT_OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "labs_assets", "WireShark"
)

LAB_FILENAMES = {
    "1": "lab1_http_creds.pcap",
    "2": "lab2_tcp_stream.pcap",
    "3": "lab3_arp_spoof.pcap",
}


# ─── Flag Generation (mirrors backend logic) ──────────────────────────────────

def make_dynamic_flag(prefix: str, user_id: str, lab_id: str) -> str:
    """Mirrors PracticeLabStateService.generateDynamicFlag() in NestJS backend."""
    seed = hashlib.sha256(f"{user_id}:{lab_id}".encode()).hexdigest()[:16].upper()
    return f"{prefix}-{seed}}}"


# ─── Lab 1: HTTP Credentials in Plain Text ────────────────────────────────────

def gen_lab1_pcap(user_id: str, lab_id: str, out_path: str) -> str:
    flag = make_dynamic_flag("FLAG{WIRESHARK-LAB1-HTTP-CREDS", user_id, lab_id)
    body = f"username=j.henderson&password={flag}".encode()

    src_mac = "aa:bb:cc:11:22:33"
    dst_mac = "dd:ee:ff:44:55:66"
    src_ip  = "192.168.1.12"
    dst_ip  = "192.168.1.1"
    sport   = 52841
    dport   = 80

    http_request = (
        b"POST /portal/auth/login HTTP/1.1\r\n"
        b"Host: 192.168.1.1\r\n"
        b"Content-Type: application/x-www-form-urlencoded\r\n"
        b"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n"
        b"Connection: keep-alive\r\n"
        b"Content-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body
    )

    http_response = (
        b"HTTP/1.1 302 Found\r\n"
        b"Location: /portal/dashboard\r\n"
        b"Set-Cookie: session=eyJ1c2VyIjoiai5oZW5kZXJzb24ifQ==; Path=/; HttpOnly\r\n"
        b"Content-Length: 0\r\n\r\n"
    )

    pkts = [
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="S", seq=1000),

        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="SA", seq=2000, ack=1001),

        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="A", seq=1001, ack=2001),

        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="PA", seq=1001, ack=2001) /
        Raw(load=http_request),

        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="PA", seq=2001, ack=1001 + len(http_request)) /
        Raw(load=http_response),

        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="FA",
            seq=1001 + len(http_request), ack=2001 + len(http_response)),
    ]

    _write(out_path, pkts)
    return flag


# ─── Lab 2: TCP Stream / Internal API JSON response ───────────────────────────

def gen_lab2_pcap(user_id: str, lab_id: str, out_path: str) -> str:
    flag         = make_dynamic_flag("FLAG{WIRESHARK-LAB2-TCP-STREAM", user_id, lab_id)
    session_data = base64.b64encode(flag.encode()).decode()

    src_mac = "11:22:33:aa:bb:cc"
    dst_mac = "44:55:66:dd:ee:ff"
    src_ip  = "10.10.0.22"
    dst_ip  = "10.10.0.5"
    sport   = 58142
    dport   = 8080

    get_request = (
        b"GET /api/internal/health-config HTTP/1.1\r\n"
        b"Host: 10.10.0.5:8080\r\n"
        b"Authorization: Bearer eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiZGV2LXdvcmtlciIsInJvbGUiOiJpbnRlcm5hbCJ9.\r\n"
        b"X-Request-ID: 4f2a8c1d-b3e7-4a90-9f1c-2d5e8b3a7c4f\r\n"
        b"User-Agent: health-monitor/2.1.0\r\n\r\n"
    )

    json_body = json.dumps({
        "status":       "healthy",
        "env":          "staging",
        "db_host":      "db-primary.internal:5432",
        "db_user":      "app_readwrite",
        "cache_ttl":    300,
        "session_data": session_data,   # <-- flag hidden here as base64
        "debug":        True,
        "build":        "20240315-a4f2",
    }, indent=2).encode()

    http_response = (
        b"HTTP/1.1 200 OK\r\n"
        b"Content-Type: application/json\r\n"
        b"X-Powered-By: Express\r\n"
        b"Cache-Control: no-store\r\n"
        b"Content-Length: " + str(len(json_body)).encode() + b"\r\n\r\n" + json_body
    )

    pkts = [
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="S", seq=3000),

        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="SA", seq=4000, ack=3001),

        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="A", seq=3001, ack=4001),

        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="PA", seq=3001, ack=4001) /
        Raw(load=get_request),

        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="PA", seq=4001, ack=3001 + len(get_request)) /
        Raw(load=http_response),

        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="FA",
            seq=3001 + len(get_request), ack=4001 + len(http_response)),

        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="FA",
            seq=4001 + len(http_response), ack=3002 + len(get_request)),
    ]

    _write(out_path, pkts)
    return flag


# ─── Lab 3: ARP Spoofing ──────────────────────────────────────────────────────

def gen_lab3_pcap(user_id: str, lab_id: str, out_path: str) -> str:
    flag         = make_dynamic_flag("FLAG{WIRESHARK-LAB3-ARP-SPOOF", user_id, lab_id)
    flag_b64     = base64.b64encode(flag.encode()).decode()

    client_mac   = "00:11:22:33:44:aa"
    client2_mac  = "00:55:66:77:88:bb"
    gateway_mac  = "00:aa:bb:cc:dd:01"
    attacker_mac = "de:ad:be:ef:13:37"
    broadcast    = "ff:ff:ff:ff:ff:ff"

    gateway_ip   = "192.168.0.1"
    client_ip    = "192.168.0.14"
    client2_ip   = "192.168.0.31"

    pkts = [
        # Normal ARP request from client
        Ether(src=client_mac,  dst=broadcast) /
        ARP(op=1, hwsrc=client_mac,  psrc=client_ip,
            hwdst="00:00:00:00:00:00", pdst=gateway_ip),

        # Legitimate gateway reply
        Ether(src=gateway_mac, dst=client_mac) /
        ARP(op=2, hwsrc=gateway_mac, psrc=gateway_ip,
            hwdst=client_mac, pdst=client_ip),

        # Normal ARP request from client2
        Ether(src=client2_mac, dst=broadcast) /
        ARP(op=1, hwsrc=client2_mac, psrc=client2_ip,
            hwdst="00:00:00:00:00:00", pdst=gateway_ip),

        # Legitimate gateway reply to client2
        Ether(src=gateway_mac, dst=client2_mac) /
        ARP(op=2, hwsrc=gateway_mac, psrc=gateway_ip,
            hwdst=client2_mac, pdst=client2_ip),

        # Gratuitous ARP from ATTACKER — flag hidden in trailing Raw bytes
        Ether(src=attacker_mac, dst=broadcast) /
        ARP(op=2, hwsrc=attacker_mac, psrc=gateway_ip,
            hwdst=broadcast, pdst=gateway_ip) /
        Raw(load=f" OUI-Lookup: Unknown ({flag_b64})".encode()),

        # Second gratuitous ARP burst (no raw payload)
        Ether(src=attacker_mac, dst=broadcast) /
        ARP(op=2, hwsrc=attacker_mac, psrc=gateway_ip,
            hwdst=broadcast, pdst=gateway_ip),

        # Client re-queries (ARP cache now poisoned)
        Ether(src=client_mac,  dst=broadcast) /
        ARP(op=1, hwsrc=client_mac,  psrc=client_ip,
            hwdst="00:00:00:00:00:00", pdst=gateway_ip),

        # Attacker impersonates gateway
        Ether(src=attacker_mac, dst=client_mac) /
        ARP(op=2, hwsrc=attacker_mac, psrc=gateway_ip,
            hwdst=client_mac, pdst=client_ip),
    ]

    _write(out_path, pkts)
    return flag


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _write(path: str, pkts: list) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    wrpcap(path, pkts)


def _resolve_path(output_dir: str, lab: str) -> str:
    return os.path.join(output_dir, LAB_FILENAMES[lab])


GENERATORS = {
    "1": gen_lab1_pcap,
    "2": gen_lab2_pcap,
    "3": gen_lab3_pcap,
}


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="CyberLabs PCAP Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--user-id",    required=True, help="User ID")
    parser.add_argument("--lab-id",     required=True, help="Lab session ID")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR,
                        help=f"Output directory (default: labs_assets/WireShark/)")

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--lab",  choices=["1", "2", "3"],
                       help="Generate a single lab PCAP")
    group.add_argument("--all",  action="store_true",
                       help="Generate all 3 labs in --output-dir")

    args = parser.parse_args()

    targets = ["1", "2", "3"] if args.all else [args.lab]

    print(f"[*] Output dir: {os.path.abspath(args.output_dir)}")
    print(f"[*] User: {args.user_id}  |  Lab session: {args.lab_id}")
    print()

    for lab_num in targets:
        out_path = _resolve_path(args.output_dir, lab_num)
        gen      = GENERATORS[lab_num]
        flag     = gen(args.user_id, args.lab_id, out_path)
        size     = os.path.getsize(out_path)
        filename = LAB_FILENAMES[lab_num]
        print(f"[+] Lab {lab_num}  →  {filename}")
        print(f"    Flag : {flag}")
        print(f"    Size : {size} bytes")
        print(f"    Path : {out_path}")
        print()

    print(f"[✓] Done at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
