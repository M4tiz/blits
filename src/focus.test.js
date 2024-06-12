/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'tape'
import focus from './focus.js'
import symbols from './lib/symbols.js'

const HOLD_TIMEOUT = 50

test('Type', (assert) => {
  assert.equal(typeof focus, 'object')
  assert.end()
})

test('Focus - Initial state', (assert) => {
  assert.ok(focus.hold === false, 'Initial focus `hold` state should be correct')
  assert.ok(focus.get() === null, 'Initial focused component should be null')
  assert.end()
})

test('Focus - `hold` property', (assert) => {
  focus.hold = true

  assert.equal(focus.hold, true, '`hold` property should be set correctly')
  assert.end()
})

test('Focus - Set focused component after the delay', (assert) => {
  focus.hold = HOLD_TIMEOUT
  assert.plan(1)
  const expected = new TestComponent()

  focus.set(expected)

  setTimeout(() => {
    assert.equal(focus.get(), expected, 'Focused component should be expected')
  }, HOLD_TIMEOUT)
})

test('Focus - Don`t focus component before the delay', (assert) => {
  assert.plan(1)
  const expected = new TestComponent()

  focus.set(expected)

  setTimeout(() => {
    assert.notEqual(focus.get(), expected, 'Expected component shouldn`t be focused')
  }, HOLD_TIMEOUT - 1)
})

test('Focus - Component state change', (assert) => {
  assert.plan(1)
  const expected = new TestComponent()

  focus.set(expected)

  setTimeout(() => {
    assert.equal(expected.lifecycle.state, 'focus', 'Component lifecycle state should be `focus`')
  }, HOLD_TIMEOUT)
})

test('Focus - Dispatch event on focus', (assert) => {
  assert.plan(2)
  const expected = new TestComponent()
  const event = new KeyboardEvent('foo')
  const capture = assert.captureFn(() => {})
  assert.intercept(document, 'dispatchEvent', { value: capture })

  focus.set(expected, event)

  setTimeout(() => {
    const calls = capture.calls
    assert.ok(calls.length > 0, 'Document dispatchEvent should be invoked')
    const arg = calls[0].args[0]
    assert.equal(arg.type, 'keydown', 'dispatchEvent should be invoked with expected event')
  }, HOLD_TIMEOUT)
})

test('Focus - Unfocus', (assert) => {
  assert.plan(1)
  const foo = new TestComponent()
  const bar = new TestComponent()
  const capture = assert.capture(foo, 'unfocus')

  focus.set(foo)
  setTimeout(() => {
    focus.set(bar)

    const calls = capture()
    assert.ok(calls.length > 0, 'Foo.unfocus() should be invoked')
  }, HOLD_TIMEOUT)
})

test('Focus - Unfocus parent', (assert) => {
  assert.plan(1)
  const foo = new TestComponent()
  const bar = new TestComponent(foo)
  const capture = assert.capture(foo, 'unfocus')

  focus.set(foo)
  setTimeout(() => {
    focus.set(bar)

    const calls = capture()
    assert.ok(calls.length === 0, 'Foo.unfocus() should not be invoked')
  }, HOLD_TIMEOUT)
})

test('Focus - Unfocus chain', (assert) => {
  assert.plan(3)
  const executions = []
  const foo = new TestComponent()
  const bar = new TestComponent(foo)
  const baz = new TestComponent(bar)
  assert.capture(foo, 'unfocus', () => executions.push('foo'))
  assert.capture(bar, 'unfocus', () => executions.push('bar'))
  assert.capture(baz, 'unfocus', () => executions.push('baz'))
  foo[symbols.inputEvents] = {
    any() {},
  }

  focus.set(baz)
  setTimeout(() => {
    focus.input('enter')
    focus.set(baz)

    assert.equal(executions[0], 'baz', 'Unfocus execution chain order should be correct')
    assert.equal(executions[1], 'baz', 'Unfocus execution chain order should be correct') //FIXME duplicated execution
    assert.equal(executions[2], 'bar', 'Unfocus execution chain order should be correct')
  }, HOLD_TIMEOUT)
})

function TestComponent(parent) {
  this.lifecycle = {}
  this.parent = parent

  this.unfocus = () => {}
}
