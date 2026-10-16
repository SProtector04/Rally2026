import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ForumPost, Poll, PostType } from '@/types/domain'
import { seedPosts, seedPolls } from '@/data/mock'

const POSTS_KEY = 'rally.forum.posts'
const POLLS_KEY = 'rally.forum.polls'

function load<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    // fall through to seed
  }
  return seed
}

export const useForumStore = defineStore('forum', () => {
  const posts = ref<ForumPost[]>(load(POSTS_KEY, seedPosts))
  const polls = ref<Poll[]>(load(POLLS_KEY, seedPolls))

  function persist() {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts.value))
    localStorage.setItem(POLLS_KEY, JSON.stringify(polls.value))
  }

  function createPost(author: string, title: string, body: string, type: PostType) {
    posts.value.unshift({
      id: `p-${Date.now()}`,
      author,
      title,
      body,
      type,
      votes: 0,
      myVote: 0,
      replies: 0,
      createdAt: new Date().toISOString(),
    })
    persist()
  }

  function votePost(id: string, direction: 1 | -1) {
    const post = posts.value.find((p) => p.id === id)
    if (!post) return
    if (post.myVote === direction) {
      post.votes -= direction
      post.myVote = 0
    } else {
      post.votes += direction - post.myVote
      post.myVote = direction
    }
    persist()
  }

  function createPoll(question: string, options: string[]) {
    polls.value.unshift({
      id: `v-${Date.now()}`,
      question,
      options: options.filter((o) => o.trim()).map((label, i) => ({
        id: `o-${Date.now()}-${i}`,
        label: label.trim(),
        votes: 0,
      })),
      myOptionId: null,
      closed: false,
    })
    persist()
  }

  function votePoll(pollId: string, optionId: string) {
    const poll = polls.value.find((p) => p.id === pollId)
    if (!poll || poll.closed) return
    if (poll.myOptionId) {
      const previous = poll.options.find((o) => o.id === poll.myOptionId)
      if (previous) previous.votes = Math.max(0, previous.votes - 1)
    }
    const option = poll.options.find((o) => o.id === optionId)
    if (option) option.votes += 1
    poll.myOptionId = optionId
    persist()
  }

  return {
    posts,
    polls,
    createPost,
    votePost,
    createPoll,
    votePoll,
  }
})
