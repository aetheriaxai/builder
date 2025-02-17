import { Dispatch } from 'redux'
import { Deployment } from 'modules/deployment/types'
import { ENS } from 'modules/ens/types'

export enum SortBy {
  DESC = 'DESC',
  ASC = 'ASC'
}

export type Props = {
  error?: string
  ensList: ENS[]
  deploymentsByWorlds: Record<string, Deployment>
  isLoggedIn: boolean
  isLoading: boolean
  onNavigate: (path: string) => void
}

export type State = {
  page: number
  sortBy: SortBy
}

export type MapStateProps = Pick<Props, 'ensList' | 'deploymentsByWorlds' | 'isLoading' | 'error' | 'isLoggedIn'>
export type MapDispatchProps = Pick<Props, 'onNavigate'>
export type MapDispatch = Dispatch
