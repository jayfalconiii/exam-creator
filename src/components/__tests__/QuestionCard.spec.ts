import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestionCard from '@/components/QuestionCard.vue'
import type { Question } from '@/types'

const mockQuestion: Question = {
  id: 1,
  topicId: 'ec2',
  text: 'What is EC2?',
  options: ['A virtual machine', 'A storage service', 'A database', 'A network service'],
  correctIndex: 0,
  explanation: 'EC2 is a virtual machine service.',
  source: 'seed',
  errorCount: 0,
  lastSeenAt: null,
  createdAt: Date.now(),
}

describe('QuestionCard', () => {
  it('has no feedback classes before any selection', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: mockQuestion,
        selectedIndex: null,
        disabled: false,
        showFeedback: false,
      },
    })
    const options = wrapper.findAll('.question-card__option')
    for (const option of options) {
      expect(option.classes()).not.toContain('question-card__option--correct')
      expect(option.classes()).not.toContain('question-card__option--incorrect')
    }
  })

  it('applies --correct class to correct option after correct selection', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: mockQuestion,
        selectedIndex: 0,
        disabled: true,
        showFeedback: true,
      },
    })
    const options = wrapper.findAll('.question-card__option')
    expect(options[0].classes()).toContain('question-card__option--correct')
    expect(options[0].classes()).not.toContain('question-card__option--incorrect')
  })

  it('applies --incorrect class to wrong option and --correct to correct option after wrong selection', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: mockQuestion,
        selectedIndex: 1,
        disabled: true,
        showFeedback: true,
      },
    })
    const options = wrapper.findAll('.question-card__option')
    expect(options[1].classes()).toContain('question-card__option--incorrect')
    expect(options[0].classes()).toContain('question-card__option--correct')
  })
})
