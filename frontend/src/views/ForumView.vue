<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CheckCircle2,
  Lock,
  MessageSquare,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Vote,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { useForumStore } from '@/stores/forum'
import type { PostType } from '@/types/domain'

const auth = useAuthStore()
const forum = useForumStore()

const activeTab = ref<'debates' | 'polls'>('debates')

const author = computed(() => auth.currentUser?.name ?? 'Anónimo')

const typeMeta: Record<PostType, { label: string; classes: string }> = {
  qa: {
    label: 'Pregunta',
    classes: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  proposal: {
    label: 'Propuesta',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  task: {
    label: 'Tarea',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
}

const title = ref('')
const body = ref('')
const type = ref<PostType>('proposal')

const pollQuestion = ref('')
const pollOptions = ref('')

function createPost() {
  if (!title.value.trim() || !body.value.trim()) return
  forum.createPost(author.value, title.value.trim(), body.value.trim(), type.value)
  title.value = ''
  body.value = ''
  type.value = 'proposal'
}

function createPoll() {
  if (!pollQuestion.value.trim()) return
  const options = pollOptions.value
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean)
  if (options.length < 2) return
  forum.createPoll(pollQuestion.value.trim(), options)
  pollQuestion.value = ''
  pollOptions.value = ''
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })
}

function pollTotal(poll: { options: { votes: number }[] }): number {
  return poll.options.reduce((sum, o) => sum + o.votes, 0)
}

function pollPercent(votes: number, total: number): number {
  return total === 0 ? 0 : Math.round((votes / total) * 100)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Foro</h1>
      <p class="text-sm text-muted-foreground">
        Coordinación, preguntas y votaciones para la gestión del trabajo.
      </p>
    </div>

    <div class="flex gap-1 rounded-lg border bg-muted/40 p-1 sm:w-fit">
      <button
        class="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none"
        :class="activeTab === 'debates' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'debates'"
      >
        <MessageSquare class="size-4" />
        Debates
      </button>
      <button
        class="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none"
        :class="activeTab === 'polls' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'polls'"
      >
        <Vote class="size-4" />
        Votaciones
      </button>
    </div>

    <template v-if="activeTab === 'debates'">
      <Card>
        <CardHeader>
          <CardTitle>Nueva publicación</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="grid gap-3 md:grid-cols-4">
            <input
              v-model="title"
              type="text"
              placeholder="Título"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 md:col-span-3 focus-visible:ring-3"
            />
            <select
              v-model="type"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3"
            >
              <option value="proposal">Propuesta</option>
              <option value="qa">Pregunta</option>
              <option value="task">Tarea</option>
            </select>
          </div>
          <textarea
            v-model="body"
            rows="3"
            placeholder="Describí tu propuesta, pregunta o tarea…"
            class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus-visible:ring-3"
          />
          <div class="flex justify-end">
            <Button @click="createPost">
              <Plus class="size-4" />
              Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div class="space-y-4">
        <Card v-for="post in forum.posts" :key="post.id">
          <CardContent class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="typeMeta[post.type].classes">
                {{ typeMeta[post.type].label }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ post.author }} · {{ formatDate(post.createdAt) }}
              </span>
            </div>
            <h3 class="text-base font-semibold leading-snug">{{ post.title }}</h3>
            <p class="text-sm text-muted-foreground">{{ post.body }}</p>
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                :class="post.myVote === 1 ? 'text-emerald-500' : ''"
                :aria-label="'Votar a favor'"
                @click="forum.votePost(post.id, 1)"
              >
                <ThumbsUp class="size-4" />
              </Button>
              <span class="min-w-8 text-center text-sm font-semibold">{{ post.votes }}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                :class="post.myVote === -1 ? 'text-rose-500' : ''"
                :aria-label="'Votar en contra'"
                @click="forum.votePost(post.id, -1)"
              >
                <ThumbsDown class="size-4" />
              </Button>
              <span class="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare class="size-4" />
                {{ post.replies }} respuestas
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>

    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle>Nueva votación</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <input
            v-model="pollQuestion"
            type="text"
            placeholder="Pregunta a votar"
            class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3"
          />
          <textarea
            v-model="pollOptions"
            rows="3"
            placeholder="Opciones (una por línea)"
            class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus-visible:ring-3"
          />
          <div class="flex justify-end">
            <Button @click="createPoll">
              <Plus class="size-4" />
              Crear votación
            </Button>
          </div>
        </CardContent>
      </Card>

      <div class="space-y-4">
        <Card v-for="poll in forum.polls" :key="poll.id">
          <CardContent class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-base font-semibold">{{ poll.question }}</h3>
              <span
                v-if="poll.closed"
                class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                <Lock class="size-3" />
                Cerrada
              </span>
            </div>
            <div class="space-y-2">
              <button
                v-for="option in poll.options"
                :key="option.id"
                :disabled="poll.closed || poll.myOptionId !== null"
                class="group w-full text-left"
                @click="forum.votePoll(poll.id, option.id)"
              >
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="flex items-center gap-2 font-medium">
                    <CheckCircle2
                      v-if="poll.myOptionId === option.id"
                      class="size-4 text-emerald-500"
                    />
                    {{ option.label }}
                  </span>
                  <span class="text-muted-foreground">
                    {{ option.votes }} votos · {{ pollPercent(option.votes, pollTotal(poll)) }}%
                  </span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full bg-gradient-brand transition-all"
                    :style="{ width: `${pollPercent(option.votes, pollTotal(poll))}%` }"
                  />
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
