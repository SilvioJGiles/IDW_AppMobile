import Ionicons from "@react-native-vector-icons/ionicons";
import { ComponentProps } from "react";

// Nombre válido de un ícono de Ionicons (las categorías lo traen como texto)
export type NombreIcono = ComponentProps<typeof Ionicons>["name"];
