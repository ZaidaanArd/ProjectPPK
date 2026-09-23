export const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? "dynamic"

export const isStaticMode = dataMode === "static"
