import type {components, paths} from './schema'

type Schemas = components['schemas']

export type Id = Schemas['Id']
export type LoginRequest = Schemas['LoginRequest']
export type LoginResponse = Schemas['LoginResponse']
export type PasswordChange = Schemas['PasswordChange']
export type Series = Schemas['Series']
export type SeriesInput = Schemas['SeriesInput']
export type Measurement = Schemas['Measurement']
export type Sensor = Schemas['Sensor']
export type SensorInput = Schemas['SensorInput']
export type SensorCreated = Schemas['SensorCreated']
export type Problem = Schemas['Problem']
export type ProblemFieldError = NonNullable<Problem['errors']>[number]

type MeasurementsQuery = NonNullable<paths['/api/measurements']['get']['parameters']['query']>

export type MeasurementSort = NonNullable<MeasurementsQuery['sort']>

export interface MeasurementsParams extends Omit<MeasurementsQuery, 'series'> {
    series?: readonly Id[]
}
