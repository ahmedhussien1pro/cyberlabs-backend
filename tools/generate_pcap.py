#!/usr/bin/env python3
"""
CyberLabs PCAP Generator
========================
Generates realistic .pcap files for Wireshark labs with dynamic per-user flags.

Requires: scapy
  pip install scapy

Usage:
  python tools/generate_pcap.py --lab 1 --user-id user123 --lab-id labABC --out output/lab1.pcap
  python tools/generate_pcap.py --lab 2 --user-id user123 --lab-id labABC --out output/lab2.pcap
  python tools/generate_pcap.py --lab 3 --user-id user123 --lab-id labABC --out output/lab3.pcap
"""

import argparse
import base64
import hashlib
import json
import os
from datetime import datetime

try:
    from scapy.all import (
        Ether, IP, TCP, UDP, ARP,
        Raw, wrpcap, Packet,
    )
except ImportError:
    raise SystemExit("[!] scapy not found. Run: pip install scapy")


# ─── Flag Generation (mirrors backend logic) ──────────────────────────────────

def make_dynamic_flag(prefix: str, user_id: str, lab_id: str) -> str:
    """Mirrors PracticeLabStateService.generateDynamicFlag() in NestJS backend."""
    seed = hashlib.sha256(f"{user_id}:{lab_id}".encode()).hexdigest()[:16].upper()
    return f"{prefix}-{seed}}}"


# ─── Lab 1: HTTP Credentials in Plain Text ────────────────────────────────────

def gen_lab1_pcap(user_id: str, lab_id: str, out_path: str) -> str:
    flag = make_dynamic_flag("FLAG{WIRESHARK-LAB1-HTTP-CREDS", user_id, lab_id)
    body = f"username=j.henderson&password={flag}".encode()

    src_mac  = "aa:bb:cc:11:22:33"
    dst_mac  = "dd:ee:ff:44:55:66"
    src_ip   = "192.168.1.12"
    dst_ip   = "192.168.1.1"
    sport    = 52841
    dport    = 80

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
        # SYN
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="S", seq=1000),
        # SYN-ACK
        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="SA", seq=2000, ack=1001),
        # ACK
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="A", seq=1001, ack=2001),
        # HTTP POST (credentials in body)
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="PA", seq=1001, ack=2001) /
        Raw(load=http_request),
        # HTTP 302 response
        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="PA", seq=2001, ack=1001 + len(http_request)) /
        Raw(load=http_response),
        # FIN
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="FA", seq=1001 + len(http_request), ack=2001 + len(http_response)),
    ]

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    wrpcap(out_path, pkts)
    return flag


# ─── Lab 2: TCP Stream / Internal API JSON response ───────────────────────────

def gen_lab2_pcap(user_id: str, lab_id: str, out_path: str) -> str:
    flag = make_dynamic_flag("FLAG{WIRESHARK-LAB2-TCP-STREAM", user_id, lab_id)
    session_data = base64.b64encode(flag.encode()).decode()

    src_mac  = "11:22:33:aa:bb:cc"
    dst_mac  = "44:55:66:dd:ee:ff"
    src_ip   = "10.10.0.22"
    dst_ip   = "10.10.0.5"
    sport    = 58142
    dport    = 8080

    get_request = (
        b"GET /api/internal/health-config HTTP/1.1\r\n"
        b"Host: 10.10.0.5:8080\r\n"
        b"Authorization: Bearer eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiZGV2LXdvcmtlciIsInJvbGUiOiJpbnRlcm5hbCJ9.\r\n"
        b"X-Request-ID: 4f2a8c1d-b3e7-4a90-9f1c-2d5e8b3a7c4f\r\n"
        b"User-Agent: health-monitor/2.1.0\r\n\r\n"
    )

    json_body = json.dumps({
        "status": "healthy",
        "env": "staging",
        "db_host": "db-primary.internal:5432",
        "db_user": "app_readwrite",
        "cache_ttl": 300,
        "session_data": session_data,  # <-- flag hidden here as base64
        "debug": True,
        "build": "20240315-a4f2",
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
        # GET request
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="PA", seq=3001, ack=4001) /
        Raw(load=get_request),
        # JSON response with session_data = base64(flag)
        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="PA", seq=4001, ack=3001 + len(get_request)) /
        Raw(load=http_response),
        # FIN
        Ether(src=src_mac, dst=dst_mac) / IP(src=src_ip, dst=dst_ip) /
        TCP(sport=sport, dport=dport, flags="FA", seq=3001 + len(get_request), ack=4001 + len(http_response)),
        Ether(src=dst_mac, dst=src_mac) / IP(src=dst_ip, dst=src_ip) /
        TCP(sport=dport, dport=sport, flags="FA", seq=4001 + len(http_response), ack=3002 + len(get_request)),
    ]

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    wrpcap(out_path, pkts)
    return flag


# ─── Lab 3: ARP Spoofing ──────────────────────────────────────────────────────

def gen_lab3_pcap(user_id: str, lab_id: str, out_path: str) -> str:
    flag        = make_dynamic_flag("FLAG{WIRESHARK-LAB3-ARP-SPOOF", user_id, lab_id)
    flag_b64    = base64.b64encode(flag.encode()).decode()

    client_mac  = "00:11:22:33:44:aa"
    client2_mac = "00:55:66:77:88:bb"
    gateway_mac = "00:aa:bb:cc:dd:01"
    attacker_mac= "de:ad:be:ef:13:37"
    broadcast   = "ff:ff:ff:ff:ff:ff"

    gateway_ip  = "192.168.0.1"
    client_ip   = "192.168.0.14"
    client2_ip  = "192.168.0.31"

    pkts = [
        # Normal ARP request from client
        Ether(src=client_mac,  dst=broadcast) /
        ARP(op=1, hwsrc=client_mac,  psrc=client_ip,  hwdst="00:00:00:00:00:00", pdst=gateway_ip),

        # Legitimate gateway reply
        Ether(src=gateway_mac, dst=client_mac) /
        ARP(op=2, hwsrc=gateway_mac, psrc=gateway_ip, hwdst=client_mac,          pdst=client_ip),

        # Normal ARP request from client2
        Ether(src=client2_mac, dst=broadcast) /
        ARP(op=1, hwsrc=client2_mac, psrc=client2_ip, hwdst="00:00:00:00:00:00", pdst=gateway_ip),

        # Legitimate gateway reply to client2
        Ether(src=gateway_mac, dst=client2_mac) /
        ARP(op=2, hwsrc=gateway_mac, psrc=gateway_ip, hwdst=client2_mac,         pdst=client2_ip),

        # ⚠ Gratuitous ARP from ATTACKER claiming gateway IP
        # Flag hidden in extra field via comment in Raw bytes appended (visible in Wireshark Details)
        Ether(src=attacker_mac, dst=broadcast) /
        ARP(op=2, hwsrc=attacker_mac, psrc=gateway_ip, hwdst=broadcast, pdst=gateway_ip) /
        Raw(load=f" OUI-Lookup: Unknown ({flag_b64})".encode()),

        # Second gratuitous ARP burst
        Ether(src=attacker_mac, dst=broadcast) /
        ARP(op=2, hwsrc=attacker_mac, psrc=gateway_ip, hwdst=broadcast, pdst=gateway_ip),

        # Client re-queries gateway (ARP cache now poisoned)
        Ether(src=client_mac,  dst=broadcast) /
        ARP(op=1, hwsrc=client_mac,  psrc=client_ip,  hwdst="00:00:00:00:00:00", pdst=gateway_ip),

        # Attacker replies as gateway
        Ether(src=attacker_mac, dst=client_mac) /
        ARP(op=2, hwsrc=attacker_mac, psrc=gateway_ip, hwdst=client_mac, pdst=client_ip),
    ]

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    wrpcap(out_path, pkts)
    return flag


# ─── CLI ──────────────────────────────────────────────────────────────────────

GENERATORS = {
    "1": gen_lab1_pcap,
    "2": gen_lab2_pcap,
    "3": gen_lab3_pcap,
}

def main():
    parser = argparse.ArgumentParser(description="CyberLabs PCAP Generator")
    parser.add_argument("--lab",     required=True, choices=["1", "2", "3"], help="Lab number")
    parser.add_argument("--user-id", required=True, help="User ID (mirrors backend session)")
    parser.add_argument("--lab-id",  required=True, help="Lab session ID")
    parser.add_argument("--out",     required=True, help="Output .pcap path")
    args = parser.parse_args()

    gen = GENERATORS[args.lab]
    flag = gen(args.user_id, args.lab_id, args.out)

    print(f"[+] Lab {args.lab} PCAP written: {args.out}")
    print(f"[+] Expected flag: {flag}")
    print(f"[+] File size: {os.path.getsize(args.out)} bytes")
    print(f"[+] Generated at: {datetime.now().isoformat()}")


if __name__ == "__main__":
    main()
