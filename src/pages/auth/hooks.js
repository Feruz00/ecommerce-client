import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { login, register, logout, getMe } from "./api";
import { useNavigate } from "react-router-dom";
export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 300000,
  });
export const useLogin = () => {
  const qc = useQueryClient();
  const nav = useNavigate();
  return useMutation({
    mutationFn: login,
    onSuccess: (d) => {
      qc.setQueryData(["me"], d);
      if (d?.data?.user?.role === "admin") {
        window.location.href = "/admin";
      } else {
        nav("/");
      }
      // console.log(d);
    },
  });
};
export const useRegister = () => {
  const qc = useQueryClient();
  const nav = useNavigate();
  return useMutation({
    mutationFn: register,
    onSuccess: (d) => {
      qc.setQueryData(["me"], d);
      nav("/");
    },
  });
};
export const useLogout = () => {
  const qc = useQueryClient();
  const nav = useNavigate();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.clear();
      nav("/");
    },
  });
};
