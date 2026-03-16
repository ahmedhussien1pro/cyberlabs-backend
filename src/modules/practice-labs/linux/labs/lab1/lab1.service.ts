// src/modules/practice-labs/linux/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// Simulated filesystem — no real shell execution
const FILESYSTEM: Record<string, { type: 'file' | 'dir'; content?: string; permissions?: string }> = {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/user': { type: 'dir' },
  '/home/user/.bashrc': { type: 'file', content: '# .bashrc', permissions: '-rw-r--r--' },
  '/home/user/.hidden_notes': { type: 'file', content: 'Password hint: think about what SUID means', permissions: '-rw-------' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/auth.log': { type: 'file', content: 'Mar 17 01:00:00 server sshd: Failed password for root', permissions: '-rw-r-----' },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/find_flag': { type: 'file', content: 'FLAG{LINUX_HIDDEN_FILE_FOUND}', permissions: '-rwsr-xr-x' }, // SUID
  '/etc': { type: 'dir' },
  '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash', permissions: '-rw-r--r--' },
  '/etc/shadow': { type: 'file', content: 'Permission denied', permissions: '-rw-------' },
};

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async executeCommand(userId: string, labId: string, command: string) {
    if (!command) throw new BadRequestException('command is required');

    const cmd = command.trim().toLowerCase();
    const parts = cmd.split(/\s+/);
    const base = parts[0];

    // ls [-la] [path]
    if (base === 'ls') {
      const path = parts[parts.length - 1].startsWith('/') ? parts[parts.length - 1] : '/';
      const showHidden = cmd.includes('-a') || cmd.includes('-la') || cmd.includes('-al');
      const showDetails = cmd.includes('-l') || cmd.includes('-la') || cmd.includes('-al');

      const entries = Object.keys(FILESYSTEM)
        .filter((k) => {
          if (k === path) return false;
          const parent = k.substring(0, k.lastIndexOf('/')) || '/';
          return parent === path;
        })
        .filter((k) => showHidden || !k.split('/').pop()!.startsWith('.'));

      if (!entries.length) return { output: 'No files found or directory does not exist.' };

      const output = entries.map((k) => {
        const name = k.split('/').pop();
        const node = FILESYSTEM[k];
        return showDetails ? `${node.permissions ?? 'drwxr-xr-x'} ${name}` : name;
      }).join('\n');

      return { output };
    }

    // cat [path]
    if (base === 'cat') {
      const path = parts[1];
      const node = FILESYSTEM[path];
      if (!node) return { output: `cat: ${path}: No such file or directory` };
      if (node.type === 'dir') return { output: `cat: ${path}: Is a directory` };
      return { output: node.content ?? '' };
    }

    // find [path] [-name pattern]
    if (base === 'find') {
      const nameFlag = parts.indexOf('-name');
      const pattern = nameFlag >= 0 ? parts[nameFlag + 1]?.replace(/\*/g, '') : '';
      const matches = Object.keys(FILESYSTEM).filter((k) =>
        k.split('/').pop()!.includes(pattern),
      );
      return { output: matches.join('\n') || 'No matches found.' };
    }

    // file [path]
    if (base === 'file') {
      const path = parts[1];
      const node = FILESYSTEM[path];
      if (!node) return { output: `file: ${path}: No such file or directory` };
      return { output: `${path}: ${node.type === 'dir' ? 'directory' : 'ASCII text'}` };
    }

    // whoami
    if (base === 'whoami') return { output: 'user' };

    // id
    if (base === 'id') return { output: 'uid=1000(user) gid=1000(user) groups=1000(user)' };

    // pwd
    if (base === 'pwd') return { output: '/home/user' };

    // help
    if (base === 'help') {
      return {
        output: 'Available commands: ls, ls -la, cat, find, file, whoami, id, pwd\nObjective: Find the hidden flag file.',
      };
    }

    return { output: `bash: ${base}: command not found` };
  }
}
