// src/modules/practice-labs/linux/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// SUID exploitation simulation
const SUID_FILESYSTEM: Record<string, { type: 'file' | 'dir'; content?: string; permissions: string; suid?: boolean }> = {
  '/': { type: 'dir', permissions: 'drwxr-xr-x' },
  '/usr/bin/vim': { type: 'file', permissions: '-rwsr-xr-x', suid: true, content: 'vim binary' },
  '/usr/bin/find': { type: 'file', permissions: '-rwsr-xr-x', suid: true, content: 'find binary' },
  '/usr/bin/python3': { type: 'file', permissions: '-rwxr-xr-x', suid: false, content: 'python3 binary' },
  '/root': { type: 'dir', permissions: 'drwx------' },
  '/root/flag.txt': { type: 'file', permissions: '-r--------', content: 'FLAG{SUID_VIM_PRIVILEGE_ESCALATION}' },
  '/home/user': { type: 'dir', permissions: 'drwxr-xr-x' },
  '/home/user/notes.txt': { type: 'file', permissions: '-rw-r--r--', content: 'Find SUID binaries with: find / -perm -u=s -type f 2>/dev/null' },
};

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async executeCommand(userId: string, labId: string, command: string) {
    if (!command) throw new BadRequestException('command is required');

    const cmd = command.trim();
    const lower = cmd.toLowerCase();

    // find / -perm -u=s -type f → list SUID binaries
    if (lower.includes('perm') && lower.includes('-u=s')) {
      const suids = Object.entries(SUID_FILESYSTEM)
        .filter(([, v]) => v.suid)
        .map(([k]) => k)
        .join('\n');
      return { output: suids };
    }

    // vim exploit: vim -c ':py3 import os; os.system("cat /root/flag.txt")'
    if (lower.includes('vim') && lower.includes('cat /root/flag.txt')) {
      return {
        output: 'FLAG{SUID_VIM_PRIVILEGE_ESCALATION}',
        exploited: true,
        explanation: 'vim has SUID bit set — running it as your user executes with root privileges. Using :py3 os.system() you can read any file.',
      };
    }

    // ls commands
    if (lower.startsWith('ls')) {
      const path = cmd.split(/\s+/).find((p) => p.startsWith('/')) ?? '/home/user';
      const entries = Object.keys(SUID_FILESYSTEM).filter((k) => {
        const parent = k.substring(0, k.lastIndexOf('/')) || '/';
        return parent === path && k !== path;
      });
      return { output: entries.map((e) => e.split('/').pop()).join('\n') || 'empty' };
    }

    // cat
    if (lower.startsWith('cat')) {
      const path = cmd.split(/\s+/)[1];
      const node = SUID_FILESYSTEM[path];
      if (!node) return { output: `cat: ${path}: No such file or directory` };
      if (path.startsWith('/root') && !cmd.includes('vim')) {
        return { output: 'cat: /root/flag.txt: Permission denied' };
      }
      return { output: node.content ?? '' };
    }

    if (lower === 'whoami') return { output: 'user' };
    if (lower === 'id') return { output: 'uid=1000(user) gid=1000(user)' };
    if (lower === 'help') {
      return {
        output:
          'Objective: Read /root/flag.txt\n' +
          'Hint: Find SUID binaries, then use them to escalate privileges.\n' +
          'Commands: ls, cat, find, whoami, id, vim',
      };
    }

    return { output: `bash: ${cmd.split(' ')[0]}: command not found` };
  }
}
