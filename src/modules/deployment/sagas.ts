import { CatalystClient, ContentClient } from 'dcl-catalyst-client'
import { Authenticator, AuthIdentity } from '@dcl/crypto'
import { Entity } from '@dcl/schemas'
import { EntityType } from 'dcl-catalyst-commons'
import { getAddress } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { takeLatest, put, select, call, take, all } from 'redux-saga/effects'
import { getData as getDeployments } from 'modules/deployment/selectors'
import { getCurrentProject, getData as getProjects } from 'modules/project/selectors'
import { Deployment, SceneDefinition, Placement } from 'modules/deployment/types'
import { Scene } from 'modules/scene/types'
import { Project } from 'modules/project/types'
import { store } from 'modules/common/store'
import { Media } from 'modules/media/types'
import { getMedia } from 'modules/media/selectors'
import { createFiles, EXPORT_PATH } from 'modules/project/export'
import { recordMediaRequest, RECORD_MEDIA_SUCCESS, RecordMediaSuccessAction } from 'modules/media/actions'
import { takeScreenshot } from 'modules/editor/actions'
import { objectURLToBlob } from 'modules/media/utils'
import { getSceneByProjectId } from 'modules/scene/utils'
import { BuilderAPI, getPreviewUrl } from 'lib/api/builder'
import { getIdentity } from 'modules/identity/utils'
import { isLoggedIn } from 'modules/identity/selectors'
import { getName } from 'modules/profile/selectors'
import { FETCH_LANDS_SUCCESS, FetchLandsSuccessAction } from 'modules/land/actions'
import { LandType } from 'modules/land/types'
import { coordsToId, idToCoords } from 'modules/land/utils'
import { getCoordsByEstateId } from 'modules/land/selectors'
import {
  DEPLOY_TO_POOL_REQUEST,
  deployToPoolFailure,
  deployToPoolSuccess,
  setProgress,
  DEPLOY_TO_LAND_REQUEST,
  deployToLandFailure,
  DeployToLandRequestAction,
  DeployToPoolRequestAction,
  deployToLandSuccess,
  CLEAR_DEPLOYMENT_REQUEST,
  ClearDeploymentRequestAction,
  clearDeploymentFailure,
  clearDeploymentSuccess,
  FETCH_DEPLOYMENTS_REQUEST,
  FetchDeploymentsRequestAction,
  fetchDeploymentsRequest,
  fetchDeploymentsSuccess,
  fetchDeploymentsFailure,
  deployToWorldSuccess,
  deployToWorldFailure,
  DeployToWorldRequestAction,
  DEPLOY_TO_WORLD_REQUEST,
  FetchWorldDeploymentsRequestAction,
  FETCH_WORLD_DEPLOYMENTS_REQUEST,
  fetchWorldDeploymentsSuccess,
  fetchWorldDeploymentsFailure
} from './actions'
import { ProgressStage } from './types'
import { makeContentFiles } from './contentUtils'
import { getEmptyDeployment, getThumbnail, UNPUBLISHED_PROJECT_ID } from './utils'
import { config } from 'config'

type UnwrapPromise<T> = T extends PromiseLike<infer U> ? U : T

// TODO: Remove this. This is using the store directly which it shouldn't and causes a circular dependency.
const handleProgress = (type: ProgressStage) => (args: { loaded: number; total: number }) => {
  const { loaded, total } = args
  const progress = ((loaded / total) * 100) | 0
  store.dispatch(setProgress(type, progress))
}

export function* deploymentSaga(builder: BuilderAPI, catalystClient: CatalystClient) {
  yield takeLatest(DEPLOY_TO_POOL_REQUEST, handleDeployToPoolRequest)
  yield takeLatest(DEPLOY_TO_LAND_REQUEST, handleDeployToLandRequest)
  yield takeLatest(CLEAR_DEPLOYMENT_REQUEST, handleClearDeploymentRequest)
  yield takeLatest(FETCH_DEPLOYMENTS_REQUEST, handleFetchDeploymentsRequest)
  yield takeLatest(FETCH_LANDS_SUCCESS, handleFetchLandsSuccess)
  yield takeLatest(DEPLOY_TO_WORLD_REQUEST, handleDeployToWorldRequest)
  yield takeLatest(FETCH_WORLD_DEPLOYMENTS_REQUEST, handleFetchWorldDeploymentsRequest)

  function* handleDeployToPoolRequest(action: DeployToPoolRequestAction) {
    const { projectId, additionalInfo } = action.payload
    const rawProject: Project | null = yield select(getCurrentProject)

    if (rawProject && rawProject.id === projectId) {
      const { thumbnail: _thumbnail, ...project } = rawProject

      try {
        yield put(setProgress(ProgressStage.NONE, 1))
        yield put(recordMediaRequest())
        const successAction: RecordMediaSuccessAction = yield take(RECORD_MEDIA_SUCCESS)
        const { north, east, south, west, preview } = successAction.payload.media

        if (!north || !east || !south || !west || !preview) {
          throw new Error('Failed to capture scene preview')
        }

        yield put(setProgress(ProgressStage.NONE, 30))
        yield call(() => builder.uploadMedia(rawProject.id, preview, { north, east, south, west }))

        yield put(setProgress(ProgressStage.NONE, 60))
        yield put(takeScreenshot())

        yield put(setProgress(ProgressStage.NONE, 90))
        yield call(() => builder.deployToPool(project.id, additionalInfo))

        yield put(setProgress(ProgressStage.NONE, 100))
        yield put(deployToPoolSuccess(window.URL.createObjectURL(preview)))
      } catch (e) {
        yield put(deployToPoolFailure(e.message))
      }
    } else if (rawProject) {
      yield put(deployToPoolFailure('Unable to Publish: Not current project'))
    } else {
      yield put(deployToPoolFailure('Unable to Publish: Invalid project'))
    }
  }

  function* deployScene(
    deployFailure: typeof deployToWorldFailure | typeof deployToLandFailure,
    contentClient: ContentClient | CatalystClient,
    projectId: string,
    placement: Placement,
    world?: string
  ) {
    const projects: ReturnType<typeof getProjects> = yield select(getProjects)

    const project = projects[projectId]
    if (!project) {
      yield put(deployFailure('Unable to Publish: Invalid project'))
      return
    }

    const scene: Scene = yield call(getSceneByProjectId, project.id)
    if (!scene) {
      yield put(deployFailure('Unable to Publish: Invalid scene'))
      return
    }

    const identity: AuthIdentity = yield call(getIdentity)
    if (!identity) {
      yield put(deployFailure('Unable to Publish: Invalid identity'))
      return
    }

    const author: ReturnType<typeof getName> = yield select(getName)

    // upload media if logged in
    let previewUrl: string | null = null
    const isLoggedInResult: boolean = yield select(isLoggedIn)
    if (isLoggedInResult) {
      const media: Media | null = yield select(getMedia)
      if (media) {
        const [north, east, south, west, thumbnail]: Array<Blob> = yield all([
          call(objectURLToBlob, media.north),
          call(objectURLToBlob, media.east),
          call(objectURLToBlob, media.south),
          call(objectURLToBlob, media.west),
          call(objectURLToBlob, media.preview)
        ])

        yield call(
          [builder, 'uploadMedia'],
          project.id,
          thumbnail,
          { north, east, south, west },
          handleProgress(ProgressStage.UPLOAD_RECORDING)
        )

        previewUrl = getPreviewUrl(project.id)
      } else {
        console.warn('Failed to upload scene preview')
      }
    }

    const files: Record<string, string> = yield call(createFiles, {
      project,
      scene,
      point: placement.point,
      rotation: placement.rotation,
      author,
      thumbnail: previewUrl,
      isDeploy: true,
      onProgress: handleProgress(ProgressStage.CREATE_FILES),
      world
    })

    const contentFiles: Map<string, Buffer> = yield call(makeContentFiles, files)

    // Remove the old communications property if it exists
    const sceneDefinition: SceneDefinition = JSON.parse(files[EXPORT_PATH.SCENE_FILE])

    const { entityId, files: hashedFiles } = yield call([contentClient, 'buildEntity'], {
      type: EntityType.SCENE,
      pointers: [...sceneDefinition.scene.parcels],
      metadata: sceneDefinition,
      files: contentFiles
    })

    const authChain = Authenticator.signPayload(identity, entityId)
    yield call([contentClient, 'deployEntity'], { entityId, files: hashedFiles, authChain })
    // generate new deployment
    const address: string = yield select(getAddress) || ''

    return {
      id: entityId,
      placement,
      owner: address,
      timestamp: +new Date(),
      layout: project.layout,
      name: project.title,
      thumbnail: previewUrl,
      projectId: project.id,
      base: sceneDefinition.scene.base,
      parcels: sceneDefinition.scene.parcels
    }
  }

  function* handleDeployToWorldRequest(action: DeployToWorldRequestAction) {
    const { world, projectId } = action.payload
    const contentClient = new ContentClient({ contentUrl: config.get('WORLDS_CONTENT_SERVER', '') })
    try {
      const deployment: Deployment = yield call(
        deployScene,
        deployToWorldFailure,
        contentClient,
        projectId,
        { point: { x: 0, y: 0 }, rotation: 'north' },
        world
      )
      yield put(deployToWorldSuccess(deployment))
    } catch (e) {
      yield put(deployToWorldFailure(e.message.split('\n')[0]))
    }
  }

  function* handleDeployToLandRequest(action: DeployToLandRequestAction) {
    const { placement, projectId, overrideDeploymentId } = action.payload
    try {
      const deployment: Deployment = yield call(deployScene, deployToLandFailure, catalystClient, projectId, placement)
      yield put(deployToLandSuccess(deployment, overrideDeploymentId))
    } catch (e) {
      yield put(deployToLandFailure(e.message.split('\n')[0]))
    }
  }

  function* handleClearDeploymentRequest(action: ClearDeploymentRequestAction) {
    const { deploymentId } = action.payload

    const deployments: ReturnType<typeof getDeployments> = yield select(getDeployments)
    const deployment = deployments[deploymentId]
    if (!deployment) {
      yield put(deployToLandFailure('Unable to Publish: Invalid deployment'))
      return
    }

    const identity: AuthIdentity = yield getIdentity()
    if (!identity) {
      yield put(deployToLandFailure('Unable to Publish: Invalid identity'))
      return
    }

    try {
      const { placement } = deployment
      const [emptyProject, emptyScene] = getEmptyDeployment(deployment.projectId || UNPUBLISHED_PROJECT_ID)
      const files: UnwrapPromise<ReturnType<typeof createFiles>> = yield call(createFiles, {
        project: emptyProject,
        scene: emptyScene,
        point: placement.point,
        rotation: placement.rotation,
        thumbnail: null,
        author: null,
        isDeploy: true,
        isEmpty: true,
        onProgress: handleProgress(ProgressStage.CREATE_FILES)
      })
      const contentFiles: Map<string, Buffer> = yield call(makeContentFiles, files)
      const sceneDefinition: SceneDefinition = JSON.parse(files[EXPORT_PATH.SCENE_FILE])
      const { entityId, files: hashedFiles } = yield call([catalystClient, 'buildEntity'], {
        type: EntityType.SCENE,
        pointers: [...sceneDefinition.scene.parcels],
        metadata: sceneDefinition,
        files: contentFiles
      })
      const authChain = Authenticator.signPayload(identity, entityId)
      yield call([catalystClient, 'deployEntity'], { entityId, files: hashedFiles, authChain })
      yield put(clearDeploymentSuccess(deploymentId))
    } catch (error) {
      yield put(clearDeploymentFailure(deploymentId, error.message))
    }
  }

  function* handleFetchLandsSuccess(action: FetchLandsSuccessAction) {
    const coords: string[] = []
    for (const land of action.payload.lands) {
      switch (land.type) {
        case LandType.PARCEL: {
          coords.push(coordsToId(land.x!, land.y!))
          break
        }
        case LandType.ESTATE: {
          const coordsByEstateId: ReturnType<typeof getCoordsByEstateId> = yield select(getCoordsByEstateId)
          if (land.id in coordsByEstateId) {
            for (const coord of coordsByEstateId[land.id]) {
              coords.push(coord)
            }
          }
        }
      }
    }
    yield put(fetchDeploymentsRequest(coords))
  }

  function formatDeployments(entities: Entity[], getDeploymentId: (entity: Entity) => string): Deployment[] {
    const deployments = new Map<string, Deployment>()
    for (const entity of entities.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1))) {
      const id = getDeploymentId(entity)
      if (id) {
        const [x, y] = idToCoords(entity.pointers[0])
        const content = entity.content
        const definition = entity.metadata as SceneDefinition
        let name = 'Untitled Scene'
        if (definition && definition.display && definition.display.title && definition.display.title !== 'interactive-text') {
          name = definition.display.title
        }
        const thumbnail: string | null = getThumbnail(definition, content)
        const placement: Placement = {
          point: { x, y },
          rotation: (definition && definition.source && definition.source.rotation) || 'north'
        }
        const projectId = (definition && definition.source && definition.source.projectId) || null
        const layout = (definition && definition.source && definition.source.layout) || null
        const { base, parcels } = definition.scene
        const isEmpty = !!(definition && definition.source && definition.source.isEmpty)
        if (!isEmpty) {
          deployments.set(id, {
            id: entity.id,
            timestamp: entity.timestamp,
            projectId,
            name,
            thumbnail,
            placement,
            owner: definition.owner,
            layout,
            base,
            parcels
          })
        } else {
          deployments.delete(id)
        }
      }
    }

    return Array.from(deployments.values())
  }

  function* handleFetchDeploymentsRequest(action: FetchDeploymentsRequestAction) {
    const { coords } = action.payload

    try {
      let entities: Entity[] = []

      if (coords.length > 0) {
        entities = yield call([catalystClient, 'fetchEntitiesByPointers'], coords)
      }
      const getSceneDeploymentId = (entity: Entity) => entity.pointers[0]
      yield put(fetchDeploymentsSuccess(coords, formatDeployments(entities, getSceneDeploymentId)))
    } catch (error) {
      yield put(fetchDeploymentsFailure(coords, error.message))
    }
  }

  function* handleFetchWorldDeploymentsRequest(action: FetchWorldDeploymentsRequestAction) {
    const { worlds } = action.payload
    const contentClient = new ContentClient({ contentUrl: config.get('WORLDS_CONTENT_SERVER', '') })
    try {
      const entities: Entity[] = []
      if (worlds.length > 0) {
        for (const world of worlds) {
          // At the moment, worlds content server only support one pointer per entity
          const entity: Entity[] = yield call([contentClient, 'fetchEntitiesByPointers'], [world])
          entities.push(entity[0])
        }
      }
      const getWorldDeploymentId = (entity: Entity) => entity.id
      yield put(fetchWorldDeploymentsSuccess(worlds, formatDeployments(entities, getWorldDeploymentId)))
    } catch (error) {
      yield put(fetchWorldDeploymentsFailure(worlds, error.message))
    }
  }
}
