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

let currentEffect = null

let paused = false

export const pauseTracking = () => {
  paused = true
}

export const resumeTracking = () => {
  paused = false
  for (let i = 0; i < trackQueue.length; i++) {
    const item = trackQueue[i]
    currentEffect = item.currentEffect
    track(item.target, item.key)
  }
  trackQueue.length = 0
}

const objectMap = new WeakMap()

const trackQueue = []

export const track = (target, key) => {
  if (currentEffect) {
    if (paused) {
      trackQueue.push({ target, key, currentEffect })
      return
    }
    let effectsMap = objectMap.get(target)
    if (!effectsMap) {
      effectsMap = new Map()
      objectMap.set(target, effectsMap)
    }
    let effects = effectsMap.get(key)
    if (!effects) {
      effects = new Set()
      effectsMap.set(key, effects)
    }
    effects.add(currentEffect)
  }
}

export const trigger = (target, key, force = false) => {
  if (paused) return
  const effectsMap = objectMap.get(target)
  if (!effectsMap) {
    return
  }
  const effects = effectsMap.get(key)
  if (effects) {
    effects.forEach((effect) => {
      effect(force)
    })
  }
}

export const effect = (effect) => {
  currentEffect = effect
  currentEffect()
  currentEffect = null
}
