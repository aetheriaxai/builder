import {
  BoundingInfo,
  Camera,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  Scene,
  SceneLoader,
  SpotLight,
  TargetCamera,
  Tools,
  Vector3
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { defaults, Options, ThumbnailType } from './getModelData'

export const EMOTE_ERROR = 'Model is EMOTE'

function refreshBoundingInfo(parent: Mesh) {
  const children = parent.getChildren().filter(mesh => mesh.id !== '__root__')

  if (children.length > 0) {
    const child = children[0] as Mesh
    // child.showBoundingBox = true
    let boundingInfo = child.getBoundingInfo()

    let min = boundingInfo.boundingBox.minimumWorld.add(child.position)
    let max = boundingInfo.boundingBox.maximumWorld.add(child.position)

    for (let i = 1; i < children.length; i++) {
      const child = children[i] as Mesh
      // child.showBoundingBox = true
      boundingInfo = child.getBoundingInfo()
      const siblingMin = boundingInfo.boundingBox.minimumWorld.add(child.position)
      const siblingMax = boundingInfo.boundingBox.maximumWorld.add(child.position)

      min = Vector3.Minimize(min, siblingMin)
      max = Vector3.Maximize(max, siblingMax)
    }

    parent.setBoundingInfo(new BoundingInfo(min, max))
  }
}

const hideMaterialList = ['hair_mat', 'avatarskin_mat']

export async function getScreenshot(url: string, options: Partial<Options> = {}) {
  // add defaults to options
  const { width, height, extension, thumbnailType } = {
    ...defaults,
    ...options
  }

  // setup renderer
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.visibility = 'hidden'
  document.body.appendChild(canvas)
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
  })

  // Load GLTF
  const scene = new Scene(engine)
  scene.autoClear = true
  scene.clearColor = new Color4(0, 0, 0, 0)

  await SceneLoader.AppendAsync(url, '', scene, undefined, extension)
  await scene.whenReadyAsync()

  // check if it's emote
  if (scene.animationGroups.length > 0) {
    throw new Error(EMOTE_ERROR)
  }

  // Setup Camera
  const camera = new TargetCamera('targetCamera', new Vector3(0, 0, 0), scene)
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA
  camera.orthoTop = 1
  camera.orthoBottom = -1
  camera.orthoLeft = -1
  camera.orthoRight = 1

  switch (thumbnailType) {
    case ThumbnailType.FRONT: {
      camera.position = new Vector3(0, 0, 2)
      break
    }
    case ThumbnailType.TOP: {
      camera.position = new Vector3(0, 1, 0)
      break
    }
    default:
      camera.position = new Vector3(-2, 2, 2)
  }

  camera.setTarget(Vector3.Zero())
  camera.attachControl(canvas, true)

  // Setup lights
  const directional = new DirectionalLight('directional', new Vector3(0, 0, 1), scene)
  directional.intensity = 1
  const top = new HemisphericLight('top', new Vector3(0, -1, 0), scene)
  top.intensity = 1
  const bottom = new HemisphericLight('bottom', new Vector3(0, 1, 0), scene)
  bottom.intensity = 1
  const spot = new SpotLight('spot', new Vector3(-2, 2, 2), new Vector3(2, -2, -2), Math.PI / 2, 1000, scene)
  spot.intensity = 1

  // Setup parent
  const parent = new Mesh('parent', scene)
  for (const mesh of scene.meshes) {
    if (mesh !== parent) {
      mesh.setParent(parent)
    }
  }

  // Clean up
  for (const materialName of hideMaterialList) {
    for (const material of scene.materials) {
      if (material.name.toLowerCase().includes(materialName)) {
        material.alpha = 0
        scene.removeMaterial(material)
      }
    }
    for (const texture of scene.textures) {
      if (texture.name.toLowerCase().includes(materialName)) {
        texture.dispose()
        scene.removeTexture(texture)
      }
    }
  }

  // resize and center
  refreshBoundingInfo(parent)
  const bounds = parent.getBoundingInfo().boundingBox.extendSize
  const size = bounds.length()
  const scale = new Vector3(1 / size, 1 / size, 1 / size)
  parent.scaling = scale
  const center = parent.getBoundingInfo().boundingBox.center.multiply(scale)
  parent.position.subtractInPlace(center)

  // remove dom element
  document.body.removeChild(canvas)

  // render
  return Tools.CreateScreenshotUsingRenderTargetAsync(engine, camera, { width, height }, undefined, undefined, true)
}
